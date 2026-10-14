#!/usr/bin/env python3
"""Restore regular hash-indexed evidence only; never import board/runtime code."""
import argparse
import gzip
import hashlib
import io
import json
import os
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

UNIT643_ALLOWED_MEMBERS = frozenset([
    "bus-lanes-solver/.cache/g350-canonical-cardinality-post-comparator-fullsuite-sourceonly-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-post-comparator-fullsuite-sourceonly-next/PREPARED.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-post-comparator-fullsuite-sourceonly-next/run/child.log",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-post-comparator-fullsuite-sourceonly-next/run/execution.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-stacked-focused-sourceonly-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-stacked-focused-sourceonly-next/PREPARED.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-stacked-focused-sourceonly-next/run/child.log",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-stacked-focused-sourceonly-next/run/execution.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-stacked-focused-sourceonly-next/run/result.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-stacked-focused-sourceonly-next/run/steps.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-stacked-fullsuite-sourceonly-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-stacked-fullsuite-sourceonly-next/PREPARED.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-stacked-fullsuite-sourceonly-next/run/child.log",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-stacked-fullsuite-sourceonly-next/run/execution.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-timeout-comparator-parser-v2-sourceonly-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-timeout-comparator-parser-v2-sourceonly-next/PREPARED.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-timeout-comparator-parser-v2-sourceonly-next/leader.py",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-timeout-comparator-parser-v2-sourceonly-next/log_parser.py",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-timeout-comparator-parser-v2-sourceonly-next/run/execution.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-timeout-comparator-parser-v2-sourceonly-next/run/new906-child.log",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-timeout-comparator-parser-v2-sourceonly-next/run/old905-child.log",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-timeout-comparator-parser-v2-sourceonly-next/run/parser-controls.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-timeout-comparator-parser-v2-sourceonly-next/run/result.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-timeout-comparator-parser-v2-sourceonly-next/run/steps.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-timeout-comparator-sourceonly-next/PREPARED.json",
    "bus-lanes-solver/.cache/g350-canonical-cardinality-timeout-comparator-sourceonly-next/leader.py",
    "bus-lanes-solver/.cache/g350-canonical-native-grid-prefix-phase-observer-sourceonly-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-canonical-native-grid-prefix-phase-observer-sourceonly-next/PREPARED.json",
    "bus-lanes-solver/.cache/g350-canonical-native-grid-prefix-phase-observer-sourceonly-next/guard.py",
    "bus-lanes-solver/.cache/g350-canonical-native-grid-prefix-phase-observer-sourceonly-next/observed-grid-native-length-bounds.test.ts",
    "bus-lanes-solver/.cache/g350-canonical-native-grid-prefix-phase-observer-sourceonly-next/preload.ts",
    "bus-lanes-solver/.cache/g350-canonical-native-grid-prefix-phase-observer-sourceonly-next/run/child.log",
    "bus-lanes-solver/.cache/g350-canonical-native-grid-prefix-phase-observer-sourceonly-next/run/execution.json",
    "bus-lanes-solver/.cache/g350-canonical-native-grid-prefix-phase-observer-sourceonly-next/run/native-phases.jsonl",
    "bus-lanes-solver/.cache/g350-canonical-native-grid-prefix-phase-observer-sourceonly-next/run/result.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-focused-count30-metadata-correction-sourceonly-next/COUNT-CORRECTED-postaudit.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-focused-count30-metadata-correction-sourceonly-next/PREPARED.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-focused-count30-metadata-correction-sourceonly-next/qualify.py",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/PREPARED.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/PRIVATE-commit.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/commands.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/guard.py",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/leader.py",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/run/child.log",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/run/execution.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/run/result.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/run/steps.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/source/lib/board-outline.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/source/lib/coupled-handoff-length-bound.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/source/lib/coupled-pair-routing-canonical-witness.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/source/lib/coupled-pair-routing.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/source/lib/grid-visibility.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/source/lib/select-route-candidates.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/source/lib/vector-scene.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/source/tests/board-outline-raster-scalar.test.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/source/tests/coupled-handoff-length-bound.test.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/source/tests/coupled-handoff-length-canonical-parity.test.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/source/tests/grid-native-length-bounds.test.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/source/tests/point-rectangle-raster.test.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-focused-sourceonly-next/source/tests/route-candidate-cache-cardinality.test.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-fullsuite-sourceonly-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-fullsuite-sourceonly-next/PREPARED.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-fullsuite-sourceonly-next/run/child.log",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-fullsuite-sourceonly-next/run/execution.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-fullsuite-sourceonly-next/run/memory.jsonl",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-prefix-phase-count30-sourceonly-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-prefix-phase-count30-sourceonly-next/PREPARED.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-prefix-phase-count30-sourceonly-next/guard.py",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-prefix-phase-count30-sourceonly-next/observed-grid-native-length-bounds.test.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-prefix-phase-count30-sourceonly-next/preload.ts",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-prefix-phase-count30-sourceonly-next/run/child.log",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-prefix-phase-count30-sourceonly-next/run/execution.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-prefix-phase-count30-sourceonly-next/run/memory.jsonl",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-prefix-phase-count30-sourceonly-next/run/native-phases.jsonl",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-prefix-phase-count30-sourceonly-next/run/result.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-single-pass-sourceonly-next/SOURCE-proposal.json",
    "bus-lanes-solver/.cache/g350-canonical-outline-raster-single-pass-sourceonly-next/adoption.patch",
    "bus-lanes-solver/.cache/g350-canonical-point-rectangle-raster-focused-sourceonly-next/PRIVATE-commit.json",
    "bus-lanes-solver/.cache/g350-canonical-point-rectangle-raster-prefix-phase-sourceonly-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-canonical-point-rectangle-raster-prefix-phase-sourceonly-next/PREPARED.json",
    "bus-lanes-solver/.cache/g350-canonical-point-rectangle-raster-prefix-phase-sourceonly-next/run/child.log",
    "bus-lanes-solver/.cache/g350-canonical-point-rectangle-raster-prefix-phase-sourceonly-next/run/execution.json",
    "bus-lanes-solver/.cache/g350-canonical-point-rectangle-raster-prefix-phase-sourceonly-next/run/native-phases.jsonl",
    "bus-lanes-solver/.cache/g350-canonical-point-rectangle-raster-prefix-phase-sourceonly-next/run/result.json",
    "bus-lanes-solver/.cache/g350-canonical-point-rectangle-raster-sourceonly-next/SOURCE-proposal.json",
    "bus-lanes-solver/.cache/g350-canonical-point-rectangle-raster-sourceonly-next/adoption.patch",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-domain-cardinality-cache-fix-sourceonly-next/SOURCE-proposal.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-domain-cardinality-cache-fix-sourceonly-next/cardinality.patch",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-domain-cardinality-canonical-regression-sourceonly-next/SOURCE-proposal.json",
    "bus-lanes-solver/.cache/root-routing-progress/cardinality-focused-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/cardinality-full-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/cardinality-post-comparator-full-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/cardinality-timeout-comparator-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/native-grid-prefix-phases-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/outline-all11-output-parent-preworker-failure.json",
    "bus-lanes-solver/.cache/root-routing-progress/outline-scalar-focused-count-mismatch-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/outline-scalar-fullsuite-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/outline-scalar-prefix-phase-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/point-rectangle-prefix-phase-COLLECTED-root.json",
    "g350-linux-handheld/cloud/TI_DDR_SOLVER_UNIT_643_QUALIFICATION_2026-10-14.md",
    "g350-linux-handheld/cloud/TI_DDR_SOLVER_UNIT_ARCHIVE_BUILT_2026-10-14.md",
    "g350-linux-handheld/cloud/TI_DDR_SOLVER_UNIT_ARCHIVE_VALIDATION_2026-10-14.json",
    "g350-linux-handheld/cloud/TI_DDR_SOLVER_UNIT_QUALIFICATION_2026-10-14.md"
])


def safe_member(name):
    require(isinstance(name, str) and name and "\\" not in name and "\0" not in name,
            "Invalid member name")
    path = PurePosixPath(name)
    require(not path.is_absolute() and path.as_posix() == name
            and all(part not in ("", ".", "..", ".git", "node_modules") for part in path.parts),
            "Unsafe or noncanonical member path: " + name)
    # This unit archive includes four selected board reports and closed solver
    # namespaces. Exact member names narrow the scope beyond the generic roots.
    require(name in UNIT643_ALLOWED_MEMBERS,
            "Evidence destination outside exact unit643 selection: " + name)
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
    require(digest(raw_manifest) == args.manifest_sha256, "Trusted manifest hash differs")
    manifest = json.loads(raw_manifest)
    require(manifest["schemaVersion"] == 1 and manifest["regularFilesOnly"] is True,
            "Unsupported evidence index")
    root = args.workspace.absolute()
    root_fd = directory_fd(root)
    raw_archive, _ = regular_bytes(args.archive)
    require(len(raw_archive) == manifest["archive"]["bytes"]
            and digest(raw_archive) == manifest["archive"]["sha256"], "Archive hash/size differs")
    rows = manifest["files"]
    require(isinstance(rows, list) and 0 < len(rows) <= 512, "Finite regular file index required")
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
    require(sum(row["bytes"] for row in rows) <= 64 * 1024 * 1024, "Logical archive bound exceeded")
    tar_limit = sum(((row["bytes"] + 511) // 512 + 1) * 512 for row in rows) + 10240
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
                descriptor = os.open(destination.name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                                     row["mode"], dir_fd=parent_fd)
                with os.fdopen(descriptor, "wb") as output:
                    output.write(data)
                    output.flush()
                    os.fchmod(output.fileno(), row["mode"])
                written, mode = regular_bytes(destination, row["bytes"], parent_fd)
                require(digest(written) == row["sha256"] and mode == row["mode"], "Written evidence differs")
                created += 1
            finally:
                os.close(parent_fd)
    os.close(root_fd)
    print(json.dumps({"archiveVerified": True, "memberCount": len(expected), "existingExactFiles": present,
                      "absentFiles": len(plan), "createdFiles": created, "restoreRequested": args.restore,
                      "symlinksRestored": 0, "runtimeImports": 0, "operationalClosureQualified": False,
                      "accepted49": False, "fabricationReady": False}))


if __name__ == "__main__":
    main()
