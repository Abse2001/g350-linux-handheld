#!/usr/bin/env python3
"""Restore pinned regular Source/DATA only; never import board/runtime code. Historical authorities are evidence, not permission for new workers."""
import argparse
import gzip
import hashlib
import io
import json
import os
import secrets
from pathlib import Path, PurePosixPath
import stat
import tarfile


def require(value, message):
    if not value:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def directory_fd(path, create=False, root_fd=None):
    """Walk every directory through held descriptors; never follow symlinks."""
    if root_fd is None:
        require(path.is_absolute() and all(part not in (".", "..") for part in path.parts), "Canonical absolute directory required")
        descriptor = os.open("/", os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        parts = path.parts[1:]
    else:
        descriptor = os.dup(root_fd)
        parts = path.parts
    try:
        for part in parts:
            if create:
                try:
                    os.mkdir(part, mode=0o700, dir_fd=descriptor)
                except FileExistsError:
                    pass
            next_descriptor = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=descriptor)
            os.close(descriptor)
            descriptor = next_descriptor
        return descriptor
    except BaseException:
        os.close(descriptor)
        raise


def regular_bytes(path, limit=32 * 1024 * 1024, parent_fd=None):
    owned = parent_fd is None
    descriptor = directory_fd(path.absolute().parent) if owned else parent_fd
    try:
        leaf = os.open(path.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=descriptor)
        with os.fdopen(leaf, "rb") as source:
            info = os.fstat(source.fileno())
            require(stat.S_ISREG(info.st_mode) and info.st_size <= limit, "Finite concrete regular file required: " + str(path))
            data = source.read(limit + 1)
            require(len(data) == info.st_size, "Regular file changed or exceeds bound")
            return data, stat.S_IMODE(info.st_mode)
    finally:
        if owned:
            os.close(descriptor)


EXPECTED_INDEX_SHA256 = '3499dc5662513e6eed13001017455cdc8a2785464debf0f9ef7ed6a826716a5d'
EXPECTED_ARCHIVE_SHA256 = '54dbf923f7ef68b4d18a0c95d126f22699c3fa4d8a9991b756f54dc8339fc1c7'
EXPECTED_ARCHIVE_BYTES = 920391
EXPECTED_FILE_COUNT = 26
EXPECTED_LOGICAL_BYTES = 12768236

CLOCK_V11_CAD_DATA_ALLOWED_MEMBERS = frozenset(['bus-lanes-solver/.cache/root-routing-progress/clock-v11-baseline-cad-94957-COLLECTED-root.json', 'bus-lanes-solver/.cache/root-routing-progress/clock-v11-fresh-cli-87907-COLLECTED-root.json', 'bus-lanes-solver/.cache/root-routing-progress/clock-v11-fresh-cli-owned-next/exports/clock-v11.kicad_pcb', 'bus-lanes-solver/.cache/root-routing-progress/clock-v11-fresh-native-42626-COLLECTED-root.json', 'bus-lanes-solver/.cache/root-routing-progress/run-clock-baseline-cad-root.py', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-actual94957-net-inference-stdlib-review-next/REPORT.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-actual94957-net-inference-stdlib-review-next/review.py', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-baseline-cad-actual-result-peer-next/NEGATIVE_CONTROLS.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-baseline-cad-actual-result-peer-next/PEER_REVIEW.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-export96-owned-topstub-lexical-diagnostic-next/REPORT.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-core-native-sourceonly-next/run-native/native18-report.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-kicad-baseline-diagnostic-sourceonly-next/SOURCE-manifest.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-kicad-baseline-diagnostic-sourceonly-next/inspect-baseline.py', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-kicad-baseline-diagnostic-sourceonly-next/run-cad/POSTAUDIT.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-kicad-baseline-diagnostic-sourceonly-next/run-cad/ROOT_AUTHORITY.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-kicad-baseline-diagnostic-sourceonly-next/run-cad/output/actual-net-connectivity-observations.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-kicad-baseline-diagnostic-sourceonly-next/run-cad/output/baseline-report.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-kicad-baseline-diagnostic-sourceonly-next/run-cad/output/baseline-zone-free.kicad_pcb', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-kicad-baseline-diagnostic-sourceonly-next/run-cad/owned/child.log', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-kicad-baseline-diagnostic-sourceonly-next/run-cad/owned/execution.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-kicad-baseline-diagnostic-sourceonly-next/run-cad/owned/memory.jsonl', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-kicad-baseline-diagnostic-sourceonly-next/run-kicad-offline.sh', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-kicad-baseline-source-peer-cpu-next/PEER_REVIEW.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-manual-pair-source-successor-next/run-core/core-controls.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-manual-pair-source-successor-next/run-core/raw-core.json', 'g350-linux-handheld/.cloud-tools/ddr-package101-cad-source-next/child/inspect-local101-hs64.py'])


def safe_member(name):
    require(isinstance(name, str) and name and "\\" not in name and "\0" not in name,
            "Invalid member name")
    path = PurePosixPath(name)
    require(not path.is_absolute() and path.as_posix() == name
            and all(part not in ("", ".", "..", ".git", "node_modules") for part in path.parts),
            "Unsafe or noncanonical member path: " + name)
    require(name in CLOCK_V11_CAD_DATA_ALLOWED_MEMBERS,
            "Evidence destination outside exact clock Source/DATA selection: " + name)
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--manifest-sha256", required=True)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--workspace", type=Path, default=Path("/workspace"))
    parser.add_argument("--restore", action="store_true", help="Create absent files; never overwrite")
    args = parser.parse_args()
    raw_manifest, _ = regular_bytes(args.manifest, 4 * 1024 * 1024)
    require(args.manifest_sha256 == EXPECTED_INDEX_SHA256 and digest(raw_manifest) == EXPECTED_INDEX_SHA256, "Pinned Source/DATA manifest hash differs")
    manifest = json.loads(raw_manifest)
    require(manifest["schemaVersion"] == 1 and manifest["regularFilesOnly"] is True,
            "Unsupported evidence index")
    root = args.workspace.absolute()
    root_fd = directory_fd(root)
    raw_archive, _ = regular_bytes(args.archive)
    require(len(raw_archive) == EXPECTED_ARCHIVE_BYTES == manifest["archive"]["bytes"]
            and digest(raw_archive) == EXPECTED_ARCHIVE_SHA256 == manifest["archive"]["sha256"], "Pinned archive hash/size differs")
    rows = manifest["files"]
    require(isinstance(rows, list) and len(rows) == EXPECTED_FILE_COUNT <= 512, "Exact finite regular file index required")
    expected = {}
    for row in rows:
        name = safe_member(row["path"]).as_posix()
        require(name not in expected, "Duplicate indexed destination: " + name)
        require(type(row["bytes"]) is int and 0 <= row["bytes"] <= 16 * 1024 * 1024
                and type(row["mode"]) is int and row["mode"] in (0o600, 0o644, 0o700, 0o755),
                "Invalid finite evidence size/mode")
        expected[name] = row
    for name in expected:
        require(not any(parent.as_posix() in expected for parent in PurePosixPath(name).parents),
                "Indexed file/directory prefix collision: " + name)
    require(set(expected) == CLOCK_V11_CAD_DATA_ALLOWED_MEMBERS, "Exact Source/DATA destination set differs")
    require(sum(row["bytes"] for row in rows) == EXPECTED_LOGICAL_BYTES <= 256 * 1024 * 1024, "Logical archive bound differs or is exceeded")
    tar_body_bytes = sum(((row["bytes"] + 511) // 512 + 1) * 512 for row in rows)
    # USTAR: two512-byte terminators, then padding to a10,240-byte record.
    tar_limit = ((tar_body_bytes + 1024 + 10239) // 10240) * 10240
    with gzip.GzipFile(fileobj=io.BytesIO(raw_archive), mode="rb") as compressed:
        raw_tar = compressed.read(tar_limit + 1)
    require(len(raw_tar) <= tar_limit, "Expanded tar header/payload bound exceeded")
    payloads = {}
    with tarfile.open(fileobj=io.BytesIO(raw_tar), mode="r:") as archive:
        for member in archive:
            require(len(payloads) < len(expected), "Excess archive header inventory")
            name = safe_member(member.name).as_posix()
            require(member.isreg() and not member.linkname and name in expected
                    and name not in payloads, "Only unique indexed regular members allowed")
            row = expected[name]
            require(member.size == row["bytes"] and member.mode == row["mode"], "Member size/mode differs")
            stream = archive.extractfile(member)
            require(stream is not None, "Missing regular payload")
            data = stream.read(row["bytes"] + 1)
            require(len(data) == row["bytes"] and digest(data) == row["sha256"], "Member hash differs")
            payloads[name] = data
    require(len(payloads) == len(expected), "Archive/index inventory differs")
    plan = []
    present = 0
    for name, row in expected.items():
        destination = root / name
        try:
            parent_fd = directory_fd(PurePosixPath(name).parent, root_fd=root_fd)
        except FileNotFoundError:
            plan.append((name, row, payloads[name]))
            continue
        try:
            try:
                data, mode = regular_bytes(destination, row["bytes"], parent_fd)
            except FileNotFoundError:
                plan.append((name, row, payloads[name]))
                continue
            require(len(data) == row["bytes"] and digest(data) == row["sha256"] and mode == row["mode"],
                    "Existing differing destination refused: " + str(destination))
            present += 1
        finally:
            os.close(parent_fd)
    # Validate the whole archive and all collisions before any restoration.
    created = 0
    if args.restore:
        for name, row, data in plan:
            destination = root / name
            parent_fd = directory_fd(PurePosixPath(name).parent, create=True, root_fd=root_fd)
            try:
                temporary = ".g350-clock-cad-data-" + secrets.token_hex(16)
                descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                                     0o600, dir_fd=parent_fd)
                try:
                    with os.fdopen(descriptor, "wb") as output:
                        output.write(data)
                        output.flush()
                        os.fchmod(output.fileno(), row["mode"])
                        os.fsync(output.fileno())
                    staged, mode = regular_bytes(Path(temporary), row["bytes"], parent_fd)
                    require(digest(staged) == row["sha256"] and mode == row["mode"], "Staged evidence differs")
                    # Exclusive link publication is atomic and never replaces
                    # an existing leaf, even if it appeared after preflight.
                    os.link(temporary, destination.name, src_dir_fd=parent_fd,
                            dst_dir_fd=parent_fd, follow_symlinks=False)
                    os.fsync(parent_fd)
                    written, mode = regular_bytes(destination, row["bytes"], parent_fd)
                    require(digest(written) == row["sha256"] and mode == row["mode"], "Written evidence differs")
                    created += 1
                finally:
                    os.unlink(temporary, dir_fd=parent_fd)
            finally:
                os.close(parent_fd)
    os.close(root_fd)
    print(json.dumps({"archiveVerified": True, "memberCount": len(expected), "existingExactFiles": present,
                      "absentFiles": len(plan), "createdFiles": created, "restoreRequested": args.restore,
                      "symlinksRestored": 0, "runtimeImports": 0, "operationalClosureQualified": False,
                      "exclusiveAtomicPublication": True, "historicalAuthoritiesEvidenceOnly": True,
                      "sdkAndRuntimeReconstructed": False, "narrowCadEvidenceIncluded": True, "allRuleCadQualificationIncluded": False,
                      "accepted49": False, "fabricationReady": False}))


if __name__ == "__main__":
    main()
