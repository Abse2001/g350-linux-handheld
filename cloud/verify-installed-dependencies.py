#!/usr/bin/env python3
"""Verify a trusted installed-tree receipt and existing archive without writes."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def verify(receipt_path, expected_receipt_sha256, audit_tool=None):
    if not re.fullmatch(r'[0-9a-f]{64}', expected_receipt_sha256):
        raise ValueError('A trusted exact receipt SHA256 is required')
    if sha(receipt_path) != expected_receipt_sha256:
        raise ValueError('Trusted archive receipt SHA256 mismatch')
    receipt = json.loads(receipt_path.read_bytes())
    if (receipt['contentSelfContained'] is not True or
            receipt['archiveContentVerified'] is not True or
            receipt['installedTreeUnchanged'] is not True or
            receipt['excludedPaths'] != [] or receipt['externalSymlinks'] != []):
        raise ValueError('Receipt is not a complete self-contained unchanged tree')
    archive = Path(receipt['archivePath'])
    if archive.stat().st_size != receipt['archiveBytes'] or sha(archive) != receipt['archiveSha256']:
        raise ValueError('Archive size or SHA256 mismatch')
    manifests = []
    for name, key in [('tree-before.json', 'beforeManifestSha256'),
                      ('tree-after-archive.json', 'afterManifestSha256')]:
        path = receipt_path.parent / name
        if sha(path) != receipt[key]:
            raise ValueError(f'{name}: trusted manifest SHA256 mismatch')
        manifest = json.loads(path.read_bytes())
        entries_hash = hashlib.sha256(json.dumps(
            manifest['entries'], sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        if (entries_hash != manifest['treeSha256'] or
                entries_hash != receipt['treeSha256'] or
                manifest['root'] != receipt['root'] or
                manifest['excludedPaths'] != [] or manifest['externalSymlinks'] != []):
            raise ValueError(f'{name}: manifest root/tree identity differs')
        manifests.append(manifest)
    if manifests[0]['entries'] != manifests[1]['entries']:
        raise ValueError('Before/after installed-tree manifests differ')
    tool = Path(audit_tool or receipt['toolPath'])
    if sha(tool) != receipt['toolSha256']:
        raise ValueError('Installed-tree audit tool SHA256 mismatch')
    root = Path(receipt['root'])
    if str(root.resolve(strict=True)) != receipt['root']:
        raise ValueError('Prepared installed-tree absolute root differs')
    command = [sys.executable, str(tool), '--root', str(root),
               '--output-directory', str(receipt_path.parent), '--verify-only']
    completed = subprocess.run(command, capture_output=True, text=True)
    if completed.returncode != 0:
        raise ValueError('Existing installed tree differs: ' + completed.stdout.strip() + completed.stderr.strip())
    tree_check = json.loads(completed.stdout)
    if (tree_check['unchanged'] is not True or
            tree_check['treeSha256'] != receipt['treeSha256'] or
            tree_check['toolSha256'] != receipt['toolSha256']):
        raise ValueError('Existing installed-tree verification identity differs')
    return {'verified': True, 'nonmutating': True, 'receiptSha256': expected_receipt_sha256,
            'archiveSha256': receipt['archiveSha256'], 'archiveBytes': receipt['archiveBytes'],
            'treeSha256': receipt['treeSha256'], 'toolSha256': receipt['toolSha256'],
            'absoluteRoot': receipt['root'], 'archiveContentBoundByTrustedReceiptAndHash': True}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--receipt', required=True, type=Path)
    parser.add_argument('--expected-receipt-sha256', required=True)
    parser.add_argument('--audit-tool', type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(verify(args.receipt, args.expected_receipt_sha256, args.audit_tool), sort_keys=True))
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
        print('Verification rejected: ' + str(error), file=sys.stderr)
        sys.exit(1)
