"""Test the actual tracked full Start only after root schedules an idle window."""
import datetime
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent
BOARD = Path('/workspace/g350-linux-handheld')
SOLVER = Path('/workspace/bus-lanes-solver')
START = BOARD / 'cloud/START_TI_DDR_FOLLOWUP_2026-10-12.sh'
HELPER = BOARD / 'cloud/restore-v4-closed-evidence.py'
MANIFEST = BOARD / 'cloud/artifacts/g350-ti-ddr-v4-closed-runs-2026-10-13.manifest.json'
ARCHIVE = BOARD / 'cloud/artifacts/g350-ti-ddr-v4-closed-runs-2026-10-13.tar.gz'
PINNED = SOLVER / '.cache/g350-d0-two-blocker-hard-reroute-next'
SCOPE = SOLVER / '.cache/g350-count-conditioned-site-recovery-next/process_scope.py'
POLICY = {'wallSeconds': 300, 'rssBytes': 4 * 1024**3,
          'sharedBytes': 24 * 1024**3, 'sampleSeconds': 0.05,
          'termGraceSeconds': 5}
EXPECTED = {
    HELPER: 'b43531921f3ee396a2e72cf8a55c180c7f9fa0ce73a298e65df8a663a5ba40fd',
    MANIFEST: 'c445edd385778f883b57fa58060b8bd866d268924f76fc8dadb187061d8fae5e',
    ARCHIVE: '05d762635f0892861f5005f47cf5b840a7496f21a330c85e36a7d7df3f3c049a',
    SCOPE: '7bdc74b15af3ba5b2c306d34a816b48cf8b9d68479b0c06a57f43787d4a4a993',
    BOARD / 'AGENTS.md': 'd3086d9ff8887bd296ed0d480fcbef732686bf45e075ae766a0a292518086723',
    BOARD / 'cloud/CONTINUE_BOARD.md': 'bb9a879c5c68c3718d24c82a77326f5b175d47899f101407b1e1ee106c8b19ef',
    BOARD / 'scripts/prepare-g350-ram90-four-layer.mjs': 'ec6b56c59d2c8f72f969934076dd3597014833e8b2e8e4387c1045f03eaadda0',
    BOARD / 'scripts/tune-g350-ram90-native-lengths.mjs': '5bfe731744159cf9f65ddde71b513cb1a0d2384574e740cd11bc087ce69b4b40',
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(path):
    value = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def save(name, value):
    path = ROOT / name
    with path.open('x') as stream:
        stream.write(json.dumps(value, indent=2, sort_keys=True) + '\n')
    path.chmod(0o600)
    return path


def snapshot(repo):
    files = {}
    for raw in subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=repo).split(b'\0'):
        if not raw:
            continue
        name = os.fsdecode(raw)
        path = repo / name
        files[name] = {'sha256': hashlib.sha256(os.readlink(path).encode()).hexdigest() if path.is_symlink() else sha(path),
                       'mode': path.lstat().st_mode & 0o777, 'symlink': path.is_symlink()}
    return {'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo, text=True).strip(),
            'branch': subprocess.check_output(['git', 'branch', '--show-current'], cwd=repo, text=True).strip(),
            'files': files}


def main():
    require(not (ROOT / 'full-start-run').exists(), 'New full Start record required')
    require(all(sha(path) == expected for path, expected in EXPECTED.items()), 'Tracked bootstrap/artifact/manifest/protected bytes changed')
    start_sha = sha(START)
    scope = load('closed_v4_start_scope', SCOPE)
    guard = load('closed_v4_trusted_dependency_guard', PINNED / 'guard.py')
    manifest, packet = guard.checked_manifest()
    require(packet == 'b0754fd0bc58d458c192003b49690300939a41abeea13f53e7b9c388cbde7a69', 'Original startup provenance packet changed')
    dependency_before = guard.checked_provenance(manifest)
    source_before = {str(repo): snapshot(repo) for repo in (BOARD, SOLVER)}
    save('source-before.json', source_before)
    # Preserve the original300s/4GiB/shared24GiB startup policy and2GiB reserve.
    memory = scope.memory()
    if memory['current'] + POLICY['rssBytes'] + 2 * 1024**3 >= POLICY['sharedBytes']:
        path = save('headroom-refusal.json', {'createdUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    'memory': memory, 'policy': POLICY, 'reserveBytes': 2 * 1024**3,
                    'fullStartLaunched': False, 'reason': 'Original startup headroom gate refused before launch'})
        raise ValueError('Original startup headroom insufficient; preserved refusal at ' + str(path))
    def before_spawn(current):
        require(current['current'] + POLICY['rssBytes'] + 2 * 1024**3 < POLICY['sharedBytes'], 'Original startup reserve no longer available')
        require(all(current['events'][key] == memory['events'][key] for key in scope.OOM_KEYS), 'New OOM before full Start')
    execution = scope.run_guarded(['bash', str(START)], BOARD, ROOT / 'full-start-run', POLICY,
                                 {'PYTHONDONTWRITEBYTECODE': '1'}, before_spawn=before_spawn)
    source_after = {str(repo): snapshot(repo) for repo in (BOARD, SOLVER)}
    save('source-after.json', source_after)
    dependency_after = guard.checked_provenance(manifest)
    held = source_before == source_after and dependency_before == dependency_after and sha(START) == start_sha
    passed = (execution['exitCode'] == 0 and not execution['diagnosticStopped']
              and execution['cleanupOwnedGroupEmpty'] and not any(execution['oomDelta'].values()) and held)
    restored = BOARD / '.cloud-tools/ti-ddr-v7-diagnostics-restored-2026-10-13-v4-closed'
    report = {'createdUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'passed': passed,
              'execution': execution, 'actualTrackedFullStartExecuted': True,
              'sourceBeforeAfterHeld': source_before == source_after,
              'sourceFileCounts': {name: len(value['files']) for name, value in source_before.items()},
              'dependencyBefore': dependency_before, 'dependencyAfter': dependency_after,
              'dependencyHeld': dependency_before == dependency_after, 'startScriptSha256': start_sha,
              'bootstrapHelperSha256': sha(HELPER), 'trackedManifestSha256': sha(MANIFEST),
              'archiveSha256': sha(ARCHIVE), 'closedV4RestoredNamespace': str(restored),
              'restoredInternalInventorySha256': sha(restored / 'manifest.json') if (restored / 'manifest.json').exists() else None,
              'protectedSha256After': {str(path): sha(path) for path in EXPECTED if path in (BOARD / 'AGENTS.md', BOARD / 'cloud/CONTINUE_BOARD.md',
                       BOARD / 'scripts/prepare-g350-ram90-four-layer.mjs', BOARD / 'scripts/tune-g350-ram90-native-lengths.mjs')},
              'installScriptRerun': False, 'hardwareRoutingPerformed': False,
              'runtimeOrHardwareAdopted': False, 'environmentDraftSaved': False,
              'accepted49': False, 'fabricationReady': False}
    path = save('FULL_START_VALIDATION_RECEIPT.json', report)
    print(json.dumps({'passed': passed, 'receiptPath': str(path), 'receiptSha256': sha(path),
                      'sourceHeld': held, 'wallSeconds': execution.get('wallSeconds'),
                      'startScriptSha256': start_sha, 'accepted49': False}, sort_keys=True))
    raise SystemExit(0 if passed else 2)


if __name__ == '__main__':
    main()
