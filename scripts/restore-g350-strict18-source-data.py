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


EXPECTED_INDEX_SHA256 = 'd07f22200a351e0e4b22484d9b9a41a098594f9b7972e0c7566bd67515db6030'
EXPECTED_ARCHIVE_SHA256 = 'e4c115f3fdcb615e2bd2df6a7086add0e9f1e02d2185ea5c4ac1d804f400c363'
EXPECTED_ARCHIVE_BYTES = 3312360
EXPECTED_FILE_COUNT = 217
EXPECTED_LOGICAL_BYTES = 58742862
EXPECTED_TAR_BYTES = 59105280

STRICT18_SOURCE_DATA_ALLOWED_MEMBERS = frozenset(['bus-lanes-solver/.cache/root-routing-progress/run-strict18-core-root.py', 'bus-lanes-solver/.cache/root-routing-progress/run-strict18-source-capture-root.py', 'bus-lanes-solver/.cache/root-routing-progress/run-strict18-types-root.py', 'bus-lanes-solver/.cache/root-routing-progress/strict18-core-36930-COLLECTED-root.json', 'bus-lanes-solver/.cache/root-routing-progress/strict18-source-capture-86442-COLLECTED-root.json', 'bus-lanes-solver/.cache/root-routing-progress/strict18-types-45112-COLLECTED-root.json', 'g350-linux-handheld/.cloud-tools/ddr-byte1-matched-cohort-followthrough-sourceonly-next/NORMALIZED_MATCHED_DQS0_INNER1_SOURCE30_BOTTOM_SOURCE40_INNER2_SOURCE31_INNER1_JOINT_DATASET18_08.json', 'g350-linux-handheld/.cloud-tools/ddr-byte1-matched-cohort-followthrough-sourceonly-next/STRICT_MATCHED_DQS0_INNER1_SOURCE30_BOTTOM_SOURCE40_INNER2_SOURCE31_INNER1_RECIPROCAL18_REPORT08.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-core-native-sourceonly-next/PREPARED-manifest.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-core-native-sourceonly-next/guard.py', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-core-native-sourceonly-next/projection_controls.py', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-core-native-sourceonly-next/run-native/native18-report.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-fresh-core-native-sourceonly-next/run_stage.py', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-manual-pair-source-successor-next/PREPARED-manifest.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-manual-pair-source-successor-next/SOURCE-manifest.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-manual-pair-source-successor-next/audit-installed-dependencies.py', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-manual-pair-source-successor-next/capture-manual-pair-source.ts', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-manual-pair-source-successor-next/guard.py', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-manual-pair-source-successor-next/inventory.py', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-manual-pair-source-successor-next/manual-pair-source-overlay.tsx', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-manual-pair-source-successor-next/process_scope.py', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-manual-pair-source-successor-next/render-manual-pair-core.ts', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-manual-pair-source-successor-next/run-core/raw-core.json', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-manual-pair-source-successor-next/run_stage.py', 'g350-linux-handheld/.cloud-tools/ddr-clock-v11-manual-pair-source-successor-next/verify-installed-dependencies.py', 'g350-linux-handheld/.cloud-tools/ddr-hs-all32-capture-first-type4096-root-successor-next/source/hs-reference-overlay.tsx', 'g350-linux-handheld/.cloud-tools/ddr-hs-all32-capture-first-type4096-root-successor-next/source/joint-owner-proposal.json', 'g350-linux-handheld/.cloud-tools/ddr-package-approaches-source-overlay-next/all101-source-candidate/grouped-proposal.json', 'g350-linux-handheld/.cloud-tools/ddr-package-approaches-source-overlay-next/all101-source-candidate/package-approaches-overlay.tsx', 'g350-linux-handheld/.cloud-tools/ddr-package101-core-qualification-source-next/run-core/fresh-core.circuit.json', 'g350-linux-handheld/.cloud-tools/ddr-package101-plus96-signals-combined-sourceonly-next/combined-input.json', 'g350-linux-handheld/.cloud-tools/ddr-package101-plus96-signals-combined-sourceonly-next/native-context.json', 'g350-linux-handheld/.cloud-tools/ddr-package101-signal96-clock-v11-source-contract-next/capture-clock-fidelity-source.ts', 'g350-linux-handheld/.cloud-tools/ddr-package101-signal96-clock-v11-source-contract-next/clock-fidelity-source-overlay.tsx', 'g350-linux-handheld/.cloud-tools/ddr-package101-signal96-clock-v11-source-contract-next/clock-fidelity-source-proposal.json', 'g350-linux-handheld/.cloud-tools/ddr-package101-signal96-clock-v11-source-contract-next/clock-source-overlay.tsx', 'g350-linux-handheld/.cloud-tools/ddr-package101-signal96-clock-v11-source-contract-next/clock-source-proposal.json', 'g350-linux-handheld/.cloud-tools/ddr-package101-signal96-clock-v11-source-contract-next/render-clock-fidelity-core.ts', 'g350-linux-handheld/.cloud-tools/ddr-package101-signal96-joint-native-sourceonly-next/combined-source-overlay.tsx', 'g350-linux-handheld/.cloud-tools/ddr-package101-signal96-joint-native-sourceonly-next/signal-source-proposal.json', 'g350-linux-handheld/.cloud-tools/ddr-strict13-reference-layout-sourceonly-next/derive-concrete-layout.py', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/CANDIDATE_GROUND_ANNULUS_BINDINGS.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/CLEAR_GND_RIBBON_PIECES_AND_FIXED_OWNER_SUPPLEMENT.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/CLOCK_REFERENCE_RECONSTRUCTION_COMPARISON.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/GEOMETRY_CONTROLS.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/README.md', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/REFERENCE_LAYOUT_AND_SHADOW_REPORT.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/SOURCE-manifest.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/SUMMARY.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/TOP_CLOCK_CONNECTED_GROUND_CORRIDOR_CANDIDATE.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/VALIDATION.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/bind-candidate-ground-annuli.py', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/compare-clock-reference-reconstruction.py', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/derive-clear-ribbon-supplement.py', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/derive-connected-clock-ground-corridor.py', 'g350-linux-handheld/.cloud-tools/ddr-strict18-concrete-reference-peer-next/derive-current18-reference-layout.py', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-core-owned-alias-independent-peer-next/PEER_REVIEW.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-core-owned-alias-successor-next/SOURCE-manifest.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-core-owned-alias-successor-next/render-strict18-core.ts', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-core-owned-alias-successor-next/run-core/POSTAUDIT.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-core-owned-alias-successor-next/run-core/ROOT_AUTHORITY.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-core-owned-alias-successor-next/run-core/core-controls.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-core-owned-alias-successor-next/run-core/owned/child.log', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-core-owned-alias-successor-next/run-core/owned/execution.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-core-owned-alias-successor-next/run-core/owned/memory.jsonl', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-core-owned-alias-successor-next/run-core/raw-core.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-core-sourceonly-next/SOURCE-manifest.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-core-sourceonly-next/render-strict18-core.ts', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-independent-peer-next/PEER_REVIEW.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/README.md', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/SOURCE-manifest.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/STDLIB_CONTROLS.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/authorized-all4-routing-input.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/capture-strict18-source.ts', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/run-capture/POSTAUDIT.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/run-capture/ROOT_AUTHORITY.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/run-capture/owned/child.log', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/run-capture/owned/execution.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/run-capture/owned/memory.jsonl', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/run-capture/source-capture.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/run-capture/source-tree-diagnostic.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/run-types/POSTAUDIT.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/run-types/owned/child.log', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/run-types/owned/execution.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/run-types/owned/memory.jsonl', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/strict18-source-overlay.tsx', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/strict18-source-proposal.json', 'g350-linux-handheld/.cloud-tools/ddr-strict18-manual-source-integration-sourceonly-next/validate-source-proposal.py', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-converter-placement.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-critical-placement.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-ddr-bootstrap.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-ddr-corridor.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-display-placement.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-full-board-clock-cluster.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-full-board-four-mil-replay.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-full-board-ground-preserving-clean-corners-replay.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-full-board-replay.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-harness-placement.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-outer-ddr-clear-corridor-layout.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-pin-allocation.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-pmic-placement.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-ram90-four-layer.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-ram90-inner-ddr.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-ram90-zero-skew-replay.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-ti-top-bottom-ddr-v10-ca-top-bytes-bottom-layout.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-ti-top-bottom-ddr-v2-layout.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-ti-top-bottom-ddr-v4-reference-bypass.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-ti-top-bottom-ddr-v5-layout.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-ti-top-bottom-ddr-v6-alternate-layout.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-ti-top-bottom-ddr-v7-ram-right-layout.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-g350-ti-top-bottom-ddr-v9-ram-y0_2-layout.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/experiments/am3352-powered-host.circuit.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/AM3352BZCZ100.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/A_0402CG180J500NT.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/A_0402WGF0000TCE.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/A_0402WGF1002TCE.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/A_0402WGF1003TCE.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/A_0402WGF1004TCE.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/A_0402WGF3302TCE.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/A_0402WGF330JTCE.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/A_0402WGF4701TCE.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/A_0603WAF1201T5E.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/A_0603WAF150JT5E.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/A_0603WAF5101T5E.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/A_0603WAF7323T5E.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/A_0_5_54PFGPZ.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/BZT52B5V1.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/CL05A105KA5NQNC.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/CL05B103KB5NNNC.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/CL05B104KO5NNNC.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/CL10A225KP8NNNC.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/CL10A475KO8NNNC.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/CL10B221KB8NNNC.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/CL10B224KA8NNNC.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/CL31A226KAHNNNE.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/CL31B475KBHNNNE.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/DF65_3P_1_7V_21_.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/DM3D_SF.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/MAX98357AETE_T.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/MBR0540T1G.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/MCP23017_E_SO.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/MT41K256M16TW_107_P.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/RC0402FR_07240RL.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/RC0402FR_0749R9L.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/SM02B_SRSS_TB_LF__SN_.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/SN74LVC1G125DBVR.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/SX32Y024000BC1T001.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/TPS3808G33DBVR.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/TPS61023DRLR.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/TPS61165DBVR.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/TPS62162DSGR.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/TPS65217CRSLR.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/TS_1187A_B_A_B.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/TYPE_C_31_M_12.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/USBLC6_2SC6/USBLC6_2SC6.obj', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/USBLC6_2SC6/USBLC6_2SC6.step', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/USBLC6_2SC6/USBLC6_2SC6.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/VLCF5020T_100M1R1_1.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/imports/XFL4020_222MEC.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/Boot.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/DdrConstraints.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/FourLayerDdrConstraints.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/HostSignals.ts', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/Power.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/PowerNetworks.ts', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/RamBypassLoops.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/RamReferenceEscapes.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/Storage.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/StorageLayout.ts', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/UsbCDevice.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/cpu-ball-map.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/memory-byte1-swizzled-connections.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/memory-byte1-top-centered-swizzled-connections.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/memory-connections.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/BacklightPinAllocation.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/ControlsAndAudio.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/ConverterPlacement.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/CriticalPlacement.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/DdrCorridorPlacement.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/Display.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/G350DdrBootstrap.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/G350RestRoutingReplay.ts', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/G350V10DdrLayerPolicy.ts', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/HarnessPlacement.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/LayoutOnly.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/PmicPlacement.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/Rgb888Power.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/converter-placements.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/cpu-bypass-placements.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/ddr-corridor-placements.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/g350-full-board-dangling-clean-rest-routing.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/g350-full-board-ground-preserving-clean-corners-paths.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/g350-outer-ddr-clear-corridor.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/g350-ram90-zero-skew-paths.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/g350-rest-routing-cache.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/g350-ti-ddr-v10-layer-policy.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/g350-ti-top-bottom-ddr-v1.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/g350-ti-top-bottom-ddr-v5.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/g350-ti-top-bottom-ddr-v7-translation.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/g350-ti-top-bottom-ddr-v9-y0_2-translation.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/host-placements.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/placement/pmic-placements.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/ram-ball-map.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/ram-bypass-loop-layout.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/lib/am3352/ram-reference-escapes.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v10-ca-top-bytes-bottom-prefork-successor-next/source/mechanical/g350-provisional-outline.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v11-ca-byte1-top-layer-bridge-next/v11-final-layer-overlay.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v11-ca-byte1-top-layer-bridge-next/v11-layer-policy.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v12b-four-carrier-ddr-source-next/v12b-final-layer-overlay.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v12b-four-carrier-ddr-source-next/v12b-layer-policy.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v12c-distinct-cohort-carriers-next/v12c-final-layer-overlay.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v12c-distinct-cohort-carriers-next/v12c-layer-policy.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v12d-byte0-top-reset-bottom-next/v12d-final-layer-overlay.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v12d-byte0-top-reset-bottom-next/v12d-layer-policy.json', 'g350-linux-handheld/.cloud-tools/ti-ddr-v12e-c-cohort-layer-swap-source-next/v12e-c-final-layer-overlay.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v12e-c-fresh-ti-window-source-next/v12e-c-fresh-ti-window-overlay.tsx', 'g350-linux-handheld/.cloud-tools/ti-ddr-v12e-ram7-reference-right-source-proposal-next/v12e-ram7-reference-right-overlay.tsx'])


def safe_member(name):
    require(isinstance(name, str) and name and "\\" not in name and "\0" not in name,
            "Invalid member name")
    path = PurePosixPath(name)
    require(not path.is_absolute() and path.as_posix() == name
            and all(part not in ("", ".", "..", ".git", "node_modules") for part in path.parts),
            "Unsafe or noncanonical member path: " + name)
    require(name in STRICT18_SOURCE_DATA_ALLOWED_MEMBERS,
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
    require(set(expected) == STRICT18_SOURCE_DATA_ALLOWED_MEMBERS, "Exact Source/DATA destination set differs")
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
                temporary = ".g350-strict18-source-data-" + secrets.token_hex(16)
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
                      "sdkAndRuntimeReconstructed": False, "sourceCaptureTypesCoreEvidenceIncluded": True, "native18Qualified": False, "cad18Qualified": False,
                      "accepted49": False, "fabricationReady": False}))


if __name__ == "__main__":
    main()
