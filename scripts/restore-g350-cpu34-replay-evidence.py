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


CPU34_REPLAY_ALLOWED_MEMBERS = frozenset([
    "bus-lanes-solver/.cache/g350-count-conditioned-site-recovery-next/audit-installed-dependencies.py",
    "bus-lanes-solver/.cache/g350-count-conditioned-site-recovery-next/dependencies/archive-receipt.json",
    "bus-lanes-solver/.cache/g350-count-conditioned-site-recovery-next/process_scope.py",
    "bus-lanes-solver/.cache/g350-count-conditioned-site-recovery-next/verify-installed-dependencies.py",
    "bus-lanes-solver/.cache/g350-fanout-source-layer-clearance-fix-next/source/lib/geometry.ts",
    "bus-lanes-solver/.cache/g350-fanout-source-layer-clearance-fix-next/source/lib/layer-names.ts",
    "bus-lanes-solver/.cache/g350-fanout-source-layer-clearance-fix-next/source/lib/net-identity.ts",
    "bus-lanes-solver/.cache/g350-fanout-source-layer-clearance-fix-next/source/lib/types.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-clock-hard-scene-capture-release-success-sourceonly-next/SOURCE-manifest.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-clock-hard-scene-capture-release-success-sourceonly-next/capture.cjs",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-clock-hard-scene-capture-sourceonly-next-v2/SOURCE-manifest.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-clock-hard-scene-capture-sourceonly-next-v2/capture.cjs",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-clock-hard-scene-controls-qualification-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-clock-hard-scene-threshold-probe-sourceonly-next/SOURCE-proposal.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-clock-hard-scene-threshold-probe-sourceonly-next/capture_probe.py",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-clock-hard-scene-threshold-qualification-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-clock-hard-scene-threshold-sourceonly-next/SOURCE-manifest.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-clock-hard-scene-threshold-sourceonly-next/capture.cjs",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-clock-native-port-corrective-sourceonly-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-clock-native-port-corrective-sourceonly-next/reference-registry.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-geometry-capture-sourceonly-next/SOURCE-manifest.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-geometry-capture-sourceonly-next/capture.cjs",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-geometry-probe-sourceonly-next/SOURCE-proposal.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-geometry-probe-sourceonly-next/capture_probe.py",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-geometry-qualification-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-geometry-qualification-next/SOURCE-manifest.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-original-grid-replay-next/AUTHORITY_TEMPLATE.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-original-grid-replay-next/COMMAND.txt",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-original-grid-replay-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-original-grid-replay-next/SOURCE-fragment.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-original-grid-replay-next/SOURCE-manifest.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-original-grid-replay-next/SOURCE-manual-fragment.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-original-grid-replay-next/guard.py",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-original-grid-replay-next/manual-candidate.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-original-grid-replay-next/replay-manual.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-original-grid-replay-next/replay.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-original-grid-replay-next/run/execution.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-original-grid-replay-next/run/replay-result.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-cpu34-active-original-grid-replay-next/run/replay-solved-path.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-domain-cardinality-gap-hard-scene-private-native-runtime128-next-v2/SOURCE-manifest.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-domain-cardinality-gap-hard-scene-private-native-runtime128-next/SOURCE-manifest.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-exact-clock-group-projection-sourceonly-next-v2/SOURCE-proposal.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-exact-clock-group-projection-sourceonly-next-v2/projection.cjs",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-owned-active-cpu-geometry-stop-sourceonly-next/SOURCE-proposal.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-owned-active-cpu-geometry-stop-sourceonly-next/process_scope_with_capture_probe.py",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-owned-via-port-native-checker-proposal-next/owned-via-terminals.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-owned-via-port-native-checker-proposal-next/validate-routed-copper-drc.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-owned-via-port-native-checker-qualification-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-owned-via-port-native-checker-qualification-next/SOURCE-manifest.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-owned-via-port-native-checker-qualification-next/guard.py",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-owned-via-port-native-checker-qualification-next/run/result.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-private-gap-observer-one-scope-fresh-pool-successor-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-private-gap-observer-one-scope-fresh-pool-successor-next/SOURCE-manifest.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-private-gap-observer-one-scope-fresh-pool-successor-next/private-gap-primitives.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-qualified-owned-via-native-gate-adapter-next/SOURCE-proposal.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-qualified-owned-via-native-gate-adapter-next/native-gate.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-real-clock26-release-capture-qualification-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-clock26-release-observer-next/SOURCE-manifest.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-clock26-threshold-observer-next/SOURCE-manifest.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-clock26-threshold-observer-next/source/lib/board-outline.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-clock26-threshold-observer-next/source/lib/copper-index.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-clock26-threshold-observer-next/source/lib/geometry.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-clock26-threshold-observer-next/source/lib/grid-components.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-clock26-threshold-observer-next/source/lib/grid-heap.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-clock26-threshold-observer-next/source/lib/grid-scratch.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-clock26-threshold-observer-next/source/lib/grid-visibility.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-clock26-threshold-observer-next/source/lib/length-search-frontier.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-clock26-threshold-observer-next/source/lib/min-heap.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-clock26-threshold-observer-next/source/lib/types.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-clock26-threshold-observer-next/source/lib/vector-scene.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-clock26-threshold-observer-next/source/lib/vector-visibility.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/SOURCE-manifest.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/clock-group-projection.cjs",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/global-selection-primitives.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/hard-scene-capture.cjs",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/input-parity.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/input.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/natural-public-output.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/original-unrestricted-input.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/positive-bank-stats.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/private-gap-primitives.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/private-selection-primitives.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/private_native_gate.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/public-failure-fields.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/public-pipeline-protocol.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/run/latest-clock-hard-scene.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/runner.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/bunfig.toml",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/align-coupled-section-boundaries.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/align-pair-transitions.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/alternate-signal-dogbones.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/backward-facing-package-terminals.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/bevel-coupled-corners.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/bevel-pair-approaches.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/bipolar-tuning.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/board-outline.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/bus-lanes-pipeline-solver.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/bus-lanes-solver.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/carrier-compaction-view.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/chamfer-ordinary-corners.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/chamfer-pair-approaches.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/coalesce-shared-runs.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/compact-envelope.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/compact-matching-groups.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/compact-unconstrained-lanes.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/compaction-cut-set.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/compaction-motion-groups.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/copper-conflict-index.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/copper-index.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/coupled-handoff-length-bound.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/coupled-pair-cache.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/coupled-pair-routing.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/coupled-pair-search-options.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/eject-blocking-lanes.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/expanded-signal-sites.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/extend-coupled-section.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/extend-package-coupling.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/extend-pair-approaches.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/exterior-pair-spacing.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/finalize-carrier-arc-pair.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/find-signal-site-pocket.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/finish-paired-network.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/finish-surface-timing.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/flexible-signal-state.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/folded-tuning.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/geometry.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/grid-components.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/grid-heap.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/grid-scratch.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/grid-visibility.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/index.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/initial-signal-dogbones.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/insert-native-surface-signal.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/insert-surface-signal.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/inter-package-tuning-window.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/is-unrouted-component-pad.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/join-signal-escapes.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/layer-colors.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/length-search-frontier.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/length-tuning.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/match-native-carrier-signals.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/min-heap.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/native-carrier-router.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/native-carrier-tuning.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/native-signal-geometry.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/negotiate-lanes.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/negotiate-signal-sites.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/negotiate-surface-routes.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/normalize-surface-carriers.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/package-approach-regions.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/pair-coupling.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/paired-network.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/pending-lane-certificates.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/plan-native-paired-carriers.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/plan-shared-pair-corridors.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/positive-native-site-bank-replay.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/prepare-surface-timing-banks.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/project-compaction-directions.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/prune-candidate-domains.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/reachable-signal-dogbones.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/rebalance-pair-escapes.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/rebuild-paired-network.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/reduce-ordinary-turns.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/refine-pair-approaches.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/refine-route-candidates.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/remap-curved-segments.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/rematch-trapped-signal-dogbones.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/repair-bus-dogbones.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/repair-grid-jogs.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/repair-lane-closures.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/repair-shared-layer-conflicts.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/reserve-bus-package-exits.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/reserve-other-carrier-terminals.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/retarget-generated-escape.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/round-coupled-return-bends.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/route-angle-validation.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/route-backward-package-buses.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/route-conflict-index.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/route-fresh-shared-buses.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/route-fresh-surface-buses.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/route-independent-buses.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/route-lengths.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/route-matched-native-single-carrier.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/route-paired-network.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/route-shared-layer-buses.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/route-surface-bridge.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/route-via-waypoint.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/run-bounded-routing.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/select-route-candidates.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/selective-native-approach-guidance.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/shared-pair-spacing.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/shared-straight-section.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/shorten-pair-approaches.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/simplify-matched-traces.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/single-layer-connectivity-solver.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/smooth-length-tuning.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/smooth-tuning.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/solve-signal-candidate-pool.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/spread-coupled-tuning-lanes.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/spread-tuning-lanes.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/staggered-bank-entries.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/surface-bus-shortcuts.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/terminal-via-clearance.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/tighten-pair-approaches.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/tune-coupled-lengths.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/tune-generated-ordinary-escapes.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/tune-generated-pair-escapes.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/tuning-bank-demands.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/types.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/vector-scene.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/vector-visibility.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/via-count-constraints.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/lib/winding-orders.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/package.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/source/tsconfig.json",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/stage-primitives.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-observer-next/stage-telemetry.ts",
    "bus-lanes-solver/.cache/g350-ti-v12e-c-runtime128-cpu34-active-public-guard-next/EXECUTION-postaudit.json",
    "bus-lanes-solver/.cache/root-routing-progress/active-cpu34-capture-controls-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/cpu34-original-grid-replay-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/hard-scene-controls-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/owned-via-native-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/private-gap-cardinality-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/real-clock26-capture-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/runtime128-clock26-release-exhausted-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/runtime128-cpu34-active-geometry-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/runtime128-shared28-success-scenes-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/strict-native-port-COLLECTED-root.json",
    "bus-lanes-solver/.cache/root-routing-progress/threshold-clock26-capture-COLLECTED-root.json"
])


def safe_member(name):
    require(isinstance(name, str) and name and "\\" not in name and "\0" not in name,
            "Invalid member name")
    path = PurePosixPath(name)
    require(not path.is_absolute() and path.as_posix() == name
            and all(part not in ("", ".", "..", ".git", "node_modules") for part in path.parts),
            "Unsafe or noncanonical member path: " + name)
    require(name in CPU34_REPLAY_ALLOWED_MEMBERS,
            "Evidence destination outside exact CPU34 replay selection: " + name)
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
