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


EXPECTED_INDEX_SHA256 = 'd06676b5843343739e63fd94debcd7fba4741e6b1fe0e9b4ff45a12d60f480e4'
EXPECTED_ARCHIVE_SHA256 = '1c2c2ec267de71e288bded72c3c66bb40cd5aeae7c397374a5bed7eaabd30ab8'
EXPECTED_ARCHIVE_BYTES = 1550769
EXPECTED_FILE_COUNT = 185
EXPECTED_LOGICAL_BYTES = 21875739
EXPECTED_TAR_BYTES = 22077440

FALLBACK644_STATIC22_ALLOWED_MEMBERS = frozenset(['bus-lanes-solver/.cache/paired-layer-fallback-first-success-control-sourceonly-next/SOURCE-manifest.json', 'bus-lanes-solver/.cache/paired-layer-fallback-first-success-control-sourceonly-next/first-success-parity.test.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-full-regression-sourceonly-next/DECLARED_READ_ONLY_DIRECTORY_LINKS_AND_DISK_PLAN.json', 'bus-lanes-solver/.cache/paired-layer-fallback-full-regression-sourceonly-next/FINAL_RESOLVED_STAGE_INVENTORY.json', 'bus-lanes-solver/.cache/paired-layer-fallback-full-regression-sourceonly-next/PR_DESCRIPTION.template.md', 'bus-lanes-solver/.cache/paired-layer-fallback-full-regression-sourceonly-next/README.md', 'bus-lanes-solver/.cache/paired-layer-fallback-full-regression-sourceonly-next/REGRESSION_PLAN.json', 'bus-lanes-solver/.cache/paired-layer-fallback-full-regression-sourceonly-next/SOURCE-manifest.json', 'bus-lanes-solver/.cache/paired-layer-fallback-full-regression-sourceonly-next/STDLIB_STAGE_CONTROLS.json', 'bus-lanes-solver/.cache/paired-layer-fallback-full-regression-sourceonly-next/TRACKED_BASELINE_COPY_INVENTORY.json', 'bus-lanes-solver/.cache/paired-layer-fallback-full-regression-sourceonly-next/production-test.proposal.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-full-regression-sourceonly-next/project/tests/paired-layer-fallback.test.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-full-regression-sourceonly-next/run-suite/POSTAUDIT.json', 'bus-lanes-solver/.cache/paired-layer-fallback-full-regression-sourceonly-next/run-suite/owned/child.log', 'bus-lanes-solver/.cache/paired-layer-fallback-full-regression-sourceonly-next/run-suite/owned/execution.json', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/BASELINE_LIB_INVENTORY.json', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/README.md', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/SOURCE-manifest.json', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/SOURCE_ANALYSIS.json', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/STDLIB_SOURCE_CONTROLS.json', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/fixture.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/align-coupled-section-boundaries.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/align-pair-transitions.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/alternate-signal-dogbones.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/backward-facing-package-terminals.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/bevel-coupled-corners.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/bevel-pair-approaches.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/bipolar-tuning.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/board-outline.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/bus-lanes-pipeline-solver.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/bus-lanes-solver.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/carrier-compaction-view.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/chamfer-ordinary-corners.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/chamfer-pair-approaches.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/coalesce-shared-runs.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/compact-envelope.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/compact-matching-groups.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/compact-unconstrained-lanes.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/compaction-cut-set.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/compaction-motion-groups.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/copper-conflict-index.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/copper-index.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/coupled-handoff-length-bound.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/coupled-pair-cache.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/coupled-pair-routing.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/eject-blocking-lanes.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/expanded-signal-sites.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/extend-coupled-section.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/extend-package-coupling.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/extend-pair-approaches.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/exterior-pair-spacing.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/find-signal-site-pocket.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/finish-paired-network.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/finish-surface-timing.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/flexible-signal-state.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/folded-tuning.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/geometry.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/grid-components.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/grid-heap.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/grid-scratch.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/grid-visibility.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/index.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/initial-signal-dogbones.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/insert-native-surface-signal.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/insert-surface-signal.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/inter-package-tuning-window.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/is-unrouted-component-pad.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/join-signal-escapes.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/layer-colors.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/length-search-frontier.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/length-tuning.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/match-native-carrier-signals.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/min-heap.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/native-carrier-router.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/native-carrier-tuning.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/native-signal-geometry.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/negotiate-lanes.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/negotiate-signal-sites.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/negotiate-surface-routes.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/normalize-surface-carriers.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/package-approach-regions.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/pair-coupling.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/paired-network.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/pending-lane-certificates.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/plan-native-paired-carriers.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/plan-shared-pair-corridors.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/prepare-surface-timing-banks.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/project-compaction-directions.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/prune-candidate-domains.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/reachable-signal-dogbones.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/rebalance-pair-escapes.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/rebuild-paired-network.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/reduce-ordinary-turns.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/refine-pair-approaches.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/refine-route-candidates.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/remap-curved-segments.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/rematch-trapped-signal-dogbones.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/repair-bus-dogbones.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/repair-grid-jogs.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/repair-lane-closures.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/repair-shared-layer-conflicts.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/reserve-bus-package-exits.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/retarget-generated-escape.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/round-coupled-return-bends.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/route-angle-validation.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/route-backward-package-buses.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/route-conflict-index.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/route-fresh-shared-buses.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/route-fresh-surface-buses.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/route-independent-buses.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/route-lengths.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/route-matched-native-single-carrier.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/route-paired-network.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/route-shared-layer-buses.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/route-surface-bridge.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/route-via-waypoint.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/run-bounded-routing.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/select-route-candidates.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/selective-native-approach-guidance.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/shared-pair-spacing.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/shared-straight-section.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/shorten-pair-approaches.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/simplify-matched-traces.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/single-layer-connectivity-solver.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/smooth-length-tuning.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/smooth-tuning.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/solve-signal-candidate-pool.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/spread-coupled-tuning-lanes.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/spread-tuning-lanes.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/staggered-bank-entries.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/surface-bus-shortcuts.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/terminal-via-clearance.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/tighten-pair-approaches.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/tune-coupled-lengths.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/tune-generated-ordinary-escapes.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/tune-generated-pair-escapes.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/tuning-bank-demands.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/types.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/vector-scene.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/vector-visibility.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/lib/winding-orders.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/negotiate-lanes.patch', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/paired-layer-fallback-baseline.test.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/paired-layer-fallback-proposed.test.ts', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/run-red-green/POSTAUDIT.json', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/run-red-green/baseline-red/child.log', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/run-red-green/baseline-red/execution.json', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/run-red-green/proposed-green-and-parity/child.log', 'bus-lanes-solver/.cache/paired-layer-fallback-sourceonly-next/run-red-green/proposed-green-and-parity/execution.json', 'bus-lanes-solver/.cache/root-routing-progress/paired-fallback-full644-COLLECTED-root.json', 'bus-lanes-solver/.cache/root-routing-progress/paired-layer-fallback-red-green-96120-COLLECTED-root.json', 'g350-linux-handheld/.cloud-tools/ddr-byte0-ram-yplus1_2-reference-aware-sourceonly-next/NORMALIZED_FRESH_RAM_YPLUS1_2_DQS0_ATOMIC_PAIR2_SHARED_TO_RAM_BOUNDARY08.json', 'g350-linux-handheld/.cloud-tools/ddr-ca20-early31-and-cpu15-16-corner-followthrough-sourceonly-next/FINITE_SOURCE12_BOTTOM_MOVED_CPU15_16_HEADER_AND_RAM_SHRINK_PROOF03.json', 'g350-linux-handheld/.cloud-tools/ddr-ca20-early31-and-cpu15-16-corner-followthrough-sourceonly-next/NORMALIZED_LITERAL227_NEW40_EARLY31_SIX_CA_JOIN20_01.json', 'g350-linux-handheld/.cloud-tools/ddr-ca20-early31-and-cpu15-16-corner-followthrough-sourceonly-next/NORMALIZED_MOVED_CPU15_16_SOURCE12_TARGET14_05_ALL20_03.json', 'g350-linux-handheld/.cloud-tools/ddr-context12-reset227-global-pool-sourceonly-next/GLOBAL_LITERAL227_LATEST_MATCHED_B1_ALL49_CANDIDATE_POOL03.json', 'g350-linux-handheld/.cloud-tools/ddr-context12-reset227-global-pool-sourceonly-next/recheck-and-freeze227-02.py', 'g350-linux-handheld/.cloud-tools/ddr-cpu19-cap-and-owned32-corner-sourceonly-next/material-context-cap19-owned32-owned4.py', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-cap19-context12-coupled-growth-sourceonly-next/seal-coupled-alternatives.py', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-cpu-head-literal227-finite-sourceonly-next/finite-head-fork.py', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/FINITE_MOVED_CPU_PAIR_HEAD_REPORT01.json', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/JOINT22_ATOMIC_MOVED_PAIR_VARIANT01_FULL_STATIC_PROOF.json', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/JOINT22_ATOMIC_MOVED_PAIR_VARIANT02_FULL_STATIC_PROOF.json', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/NORMALIZED_OWNER_MOVED_CPU_DQS0_AND_SOURCE12_JOINT22_VARIANT01.json', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/NORMALIZED_OWNER_MOVED_CPU_DQS0_AND_SOURCE12_JOINT22_VARIANT02.json', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/OWNER_CLOSED_227_PLANNING_DELTA.json', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/OWNER_SOURCE-manifest.json', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/OWNER_STDLIB_CONTROL.json', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/PLANNING_NATIVE_CONTEXT_TWO_OWNED_CPU_BARRELS_MOVED_NOT_CORE.json', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/PLANNING_NUMERIC_FULL49_TWO_OWNED_CPU_BARRELS_MOVED.json', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/PLANNING_SOLVER_VIEW_MOVED_CPU_AND_JOINT22_SELECTED_LAYER_HINTS_VARIANT01.json', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/PLANNING_SOLVER_VIEW_MOVED_CPU_AND_JOINT22_SELECTED_LAYER_HINTS_VARIANT02.json', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/RESULT.json', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/SOURCE-manifest.json', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/finite-pair-heads.py', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/material-owner-move.py', 'g350-linux-handheld/.cloud-tools/ddr-dqs0-moved-cpu15-16-plus-source12-joint-sourceonly-next/seal-joint22.py', 'g350-linux-handheld/.cloud-tools/ddr-fallback644-and-static22-source-data-preservation-proposal-next/DEPENDENCY_AND_EXCLUSION_PLAN.json', 'g350-linux-handheld/.cloud-tools/ddr-reset10-context12-two-owned-breakout-227-sourceonly-next/EMPTY49_CONTEXT12_PLUS_RESET2_227_MATERIAL_CONTEXT02.json', 'g350-linux-handheld/.cloud-tools/ddr-reset10-context12-two-owned-breakout-227-sourceonly-next/FULL49_NUMERIC_INPUT_CONTEXT12_PLUS_RESET2_227.json', 'g350-linux-handheld/.cloud-tools/ddr-reset10-context12-two-owned-breakout-227-sourceonly-next/FULL49_SOLVER_VIEW_ACTUAL_NUMERIC_MATERIAL_RESET2_227_02.json', 'g350-linux-handheld/.cloud-tools/ddr-reset10-context12-two-owned-breakout-227-sourceonly-next/FULL49_SOLVER_VIEW_RESET_BARREL_IDENTITY_CLEAN_PROJECTION03.json', 'g350-linux-handheld/.cloud-tools/ddr-reset10-context12-two-owned-breakout-227-sourceonly-next/NATIVE_CONTEXT_CONTEXT12_PLUS_RESET2_227_HYPOTHESIS.json', 'g350-linux-handheld/.cloud-tools/ddr-reset10-context12-two-owned-breakout-227-sourceonly-next/material-reset227-proposal.py', 'g350-linux-handheld/.cloud-tools/ddr-source31-canonical227-one-epoch-sourceonly-next/exact-canonical227-scene.py'])


def safe_member(name):
    require(isinstance(name, str) and name and "\\" not in name and "\0" not in name,
            "Invalid member name")
    path = PurePosixPath(name)
    require(not path.is_absolute() and path.as_posix() == name
            and all(part not in ("", ".", "..", ".git", "node_modules") for part in path.parts),
            "Unsafe or noncanonical member path: " + name)
    require(name in FALLBACK644_STATIC22_ALLOWED_MEMBERS,
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
                and type(row["mode"]) is int and row["mode"] in (0o444, 0o600, 0o644, 0o700, 0o755),
                "Invalid finite evidence size/mode")
        expected[name] = row
    for name in expected:
        require(not any(parent.as_posix() in expected for parent in PurePosixPath(name).parents),
                "Indexed file/directory prefix collision: " + name)
    require(set(expected) == FALLBACK644_STATIC22_ALLOWED_MEMBERS, "Exact Source/DATA destination set differs")
    require(sum(row["bytes"] for row in rows) == EXPECTED_LOGICAL_BYTES <= 256 * 1024 * 1024, "Logical archive bound differs or is exceeded")
    require(manifest["expandedTarBytes"] == EXPECTED_TAR_BYTES <= EXPECTED_LOGICAL_BYTES + EXPECTED_FILE_COUNT * 4096 + 20480, "Pinned finite PAX header/payload bound differs")
    tar_limit = EXPECTED_TAR_BYTES
    with gzip.GzipFile(fileobj=io.BytesIO(raw_archive), mode="rb") as compressed:
        raw_tar = compressed.read(tar_limit + 1)
    require(len(raw_tar) == tar_limit, "Expanded tar header/payload exact byte count differs")
    payloads = {}
    with tarfile.open(fileobj=io.BytesIO(raw_tar), mode="r:") as archive:
        for member in archive:
            require(len(payloads) < len(expected), "Excess archive header inventory")
            name = safe_member(member.name).as_posix()
            require(set(member.pax_headers) <= {"path"}, "Only indexed PAX path metadata permitted")
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
                temporary = ".g350-fallback644-static22-source-data-" + secrets.token_hex(16)
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
                      "sdkAndRuntimeReconstructed": False, "actualFocusedExpectedRedExitCode": 1, "actualFocusedGreenAndParityExitCode": 0, "actualDefaultTestPassCount": 644, "actualDefaultTestFailCount": 0, "static22GenuineSourceCoreNativeCadQualified": False, "elevenBenchmarkOutcomePackaged": False,
                      "accepted49": False, "fabricationReady": False}))


if __name__ == "__main__":
    main()
