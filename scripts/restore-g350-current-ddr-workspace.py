#!/usr/bin/env python3
"""Verify current DDR evidence; add --restore to recreate missing saved/workspace files.

Run with Python from the existing /workspace/g350-linux-handheld checkout.
This restores source/data only, never routes or imports an SDK. Historical
receipts do not establish current execution ownership or fabrication readiness.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import stat
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = "cloud/artifacts/"
LATEST = ARTIFACTS + "g350-four-layer-both-bytes-ca18-connected49-source333-2026-10-17.manifest.json"
LATEST_SHA256 = "659958d5a6e43edc6d5d71256ed74c74493f758f0459a1f9efbfac5022ee8087"
HELPER_SHA256 = {
    "restore-g350-source23-core-native-cli-cad-source-data.py": "085a3fd86aa449729370bbb683ac37b83303a825c181610dcc15794a2534adf6",
    "restore-g350-source24-through-api-source-data.py": "6a252e9a61d3f50d0e418f37aeada64a13579bde423cc448b99b5e33a015a385",
    "restore-g350-source24-cli-cad-delta-source-data.py": "36df1092fdf04e6bc8f8109f65658350ccb5410c9e923abeb45c5b2331d2e75e",
    "restore-g350-source24-through47-small-source-data.py": "d5642e2d50a84b8e68765ed2371313063d8ea19d5b99ac644cb502fa822443ce",
    "restore-g350-source26-through52-source-data.py": "182929cc943d24831b977bc70072bbdba7202c9761223c5fbafd54e62523d1ea",
    "restore-g350-source29-through60-source-data.py": "649776f59da98c245a4d08548304e3d02bd6e322f2699227df1c17407b7683ee",
    "restore-g350-source32-through71-source-data.py": "f316e006aa8ada49ee6ce004e1901d123a6f48ae432aa0c4bf7a1e69b28b43af",
    "restore-g350-routing-evidence.py": "148bad0fc4132ece5f78f18b05e4bc71d79019312343eda954ed7ca91874a643",
    "restore-g350-four-layer-routing-workspace.py": "6c5d321a256eadf58697f0f565b5bffa4a55491fce39ed0db7e7675604b6f3cc",
}
# Each completed increment adds the manifest argument required by later helpers.
LINEAGE = [
    ("source23-core-native-cli-cad", "g350-ti-ddr-source23-core-native-cli-cad-public-failure-2026-10-14", "a6dee536ea8fe0cfa3a53db25590f63fbd176d7fe8fe878fdd7d38c69d6036df", "--base-manifest"),
    ("source24-through-api", "g350-ti-ddr-source24-through-api-source-data-2026-10-15", "8c85472bbbf03d5092f6d382781435f6b805d9fb80bc655a4e3ebebfde43860a", "--source24-api-manifest"),
    ("source24-cli-cad-delta", "g350-ti-ddr-source24-cli-cad-delta-source-data-2026-10-15", "badac1ce75c281dd156842ab2b91c18695f57d24daa5f317d816597af074d61e", "--source24-cli45-manifest"),
    ("source24-through47-small", "g350-ti-ddr-source24-cad46-cad47-small-source-data-2026-10-15", "ed804e00a4eea89e4bf4ae0e00bed042f4afd3aa1b5583dcd6be9b25f05bb771", "--source24-through47-manifest"),
    ("source26-through52", "g350-ti-ddr-source26-through-cad52-source-data-2026-10-15", "264cda5a1855071306af251c8d784b9fb313b94ca836a8a66717a19a8dddf240", "--source26-through52-manifest"),
    ("source29-through60", "g350-ti-ddr-source29-through-cad60-source-data-2026-10-15", "7a39295995479be5b4328d8fe32f9a89d94e3acf4215f075ab8022cd3c475eab", "--source29-through60-manifest"),
    ("source32-through71", "g350-ti-ddr-source32-through-cad71-source-data-2026-10-15", "88355cb25a68816e1cd6e2133e66b52feff010387cfc1f1e56af8ecc1b964d68", None),
]


def require(value, message):
    if not value:
        raise ValueError(message)


def relative_path(name):
    path = PurePosixPath(name)
    require(not path.is_absolute() and path.as_posix() == name
            and all(part not in (".", "..", ".git", "node_modules") for part in path.parts),
            "Unexpected relative evidence path: " + str(name))
    return ROOT / path


def verify_file(path, pin):
    require(path.absolute() == path.resolve(strict=True), "Symlink evidence path refused: " + str(path))
    info = path.stat()
    require(stat.S_ISREG(info.st_mode), "Regular evidence file required: " + str(path))
    if "bytes" in pin:
        require(info.st_size == pin["bytes"], "Evidence size differs: " + str(path))
    if "mode" in pin:
        require(stat.S_IMODE(info.st_mode) == pin["mode"], "Evidence mode differs: " + str(path))
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    require(digest.hexdigest() == pin["sha256"], "Evidence hash differs: " + str(path))


def pinned_json(name, sha256):
    path = relative_path(name)
    verify_file(path, {"sha256": sha256})
    return json.loads(path.read_text())


def run_helper(name, arguments):
    helper = ROOT / "scripts" / name
    verify_file(helper, {"sha256": HELPER_SHA256[name]})
    print("Checking " + name, flush=True)
    subprocess.run([sys.executable, str(helper), *map(str, arguments)],
                   cwd=ROOT, check=True, timeout=60)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--restore", action="store_true", help="Create missing files; refuse differences.")
    args = parser.parse_args()
    require(ROOT == Path("/workspace/g350-linux-handheld") and ROOT.resolve() == ROOT,
            "Use the existing canonical /workspace/g350-linux-handheld checkout")
    require((ROOT.parent / "bus-lanes-solver/node_modules").is_dir(), "Pinned solver dependencies must already exist")
    for name, sha256 in HELPER_SHA256.items():
        verify_file(ROOT / "scripts" / name, {"sha256": sha256})
    latest = pinned_json(LATEST, LATEST_SHA256)
    dependencies = latest["baseArchiveDependenciesInRestoreOrder"]
    require(len(dependencies) == 10, "Expected ten current checkpoint predecessors")
    checkpoints = []
    for row in dependencies + [dict(latest["archive"], manifest=LATEST, manifestSha256=LATEST_SHA256)]:
        name = row["manifest"]
        require(name.startswith(ARTIFACTS) and row["path"].startswith(ARTIFACTS), "Unexpected archive location")
        manifest = pinned_json(name, row["manifestSha256"])
        require(all(manifest["archive"][key] == row[key] for key in ("path", "bytes", "sha256")), "Archive binding differs")
        verify_file(relative_path(row["path"]), row)
        saved = manifest["inputDirectories"][0]
        require(saved.startswith(".cloud-tools/ddr-four-layer-"), "Unexpected canonical saved directory")
        checkpoints.append((name, saved))
    require(len(set(name for name, _ in checkpoints)) == 11, "Duplicate checkpoint manifest")
    for _, stem, pin, _ in LINEAGE:
        manifest = pinned_json(ARTIFACTS + stem + ".manifest.json", pin)
        verify_file(relative_path(ARTIFACTS + stem + ".tar.gz"), manifest["archive"])
    # Verify every current archive before the first possible restoration write.
    for name, _ in checkpoints:
        run_helper("restore-g350-routing-evidence.py", [relative_path(name), "--verify-archive"])
    prior_arguments = []
    restore = ["--restore"] if args.restore else []
    for suffix, stem, pin, next_flag in LINEAGE:
        manifest = relative_path(ARTIFACTS + stem + ".manifest.json")
        run_helper("restore-g350-" + suffix + "-source-data.py", [
            "--manifest", manifest, "--manifest-sha256", pin,
            "--archive", relative_path(ARTIFACTS + stem + ".tar.gz"), *prior_arguments, *restore])
        if next_flag:
            prior_arguments.extend([next_flag, manifest])
    for name, saved in checkpoints:
        if args.restore:
            run_helper("restore-g350-routing-evidence.py", [relative_path(name)])
        run_helper("restore-g350-four-layer-routing-workspace.py", ["--saved-directory", relative_path(saved), *restore])
    saved_manifest = ".cloud-tools/ddr-four-layer-source333-2026-10-17/WORKSPACE_RESTORE_MANIFEST.json"
    metadata_pin = next(row for row in latest["files"] if row["path"] == saved_manifest)
    verify_file(relative_path(saved_manifest), metadata_pin)
    workspace = json.loads(relative_path(saved_manifest).read_text())
    targets = workspace["files"] + workspace["baseDependencyRestoreFiles"]
    require(len(targets) == len({row["restorePath"] for row in targets}) == 368,
            "Expected exactly 368 unique Source333 local/prerequisite targets")
    for row in targets + workspace["immutableWorkspaceAssets"] + workspace["immutableAssetsRestoredByBaseArchives"]:
        verify_file(Path(row["restorePath"]), row)
    solver_root = Path(workspace["solverSourceRoot"])
    solver_manifest = json.loads((solver_root.parent / "SOURCE-manifest.json").read_text())
    require(len(solver_manifest["solverSourceFiles"]) == 120, "Expected 120 current solver source pins")
    for row in solver_manifest["solverSourceFiles"]:
        verify_file(Path(row["path"]), row)
    link = solver_root.parent / "node_modules"
    require(link.is_symlink() and link.resolve() == ROOT.parent / "bus-lanes-solver/node_modules",
            "Pinned solver dependency link differs")
    print(json.dumps({"mode": "restore" if args.restore else "verify", "source333TargetsVerified": 368,
                      "solverSourceFilesVerified": 120, "routingExecuted": False,
                      "historicalReceiptsConferCurrentAuthority": False, "fabricationReady": False}))


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        sys.exit(error.returncode if 0 < error.returncode < 256 else 1)
    except subprocess.TimeoutExpired as error:
        print("Restoration helper timed out: " + str(error.cmd[1]), file=sys.stderr)
        sys.exit(124)
    except (OSError, ValueError, KeyError, StopIteration) as error:
        print("Current DDR workspace verification failed: " + str(error), file=sys.stderr)
        sys.exit(1)
