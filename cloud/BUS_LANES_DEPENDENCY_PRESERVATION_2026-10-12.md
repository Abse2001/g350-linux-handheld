# Installed dependency preservation for the prepared G350 environment

The persisted board paths are `cloud/audit-installed-dependencies.py` and `cloud/verify-installed-dependencies.py`. These files retain the exact independently tested helper bytes. They verify the prepared bus solver dependency tree and its ignored content archive; they do not install packages, run a resolver, restore files or change the board runtime.

Add this verification to Start after sourcing the board environment:

```sh
source /workspace/g350-linux-handheld/cloud/env.sh
python3 /workspace/g350-linux-handheld/cloud/verify-installed-dependencies.py \
  --receipt /workspace/bus-lanes-solver/.cache/topology-installed-dependencies-20261012T0154Z/archive-receipt.json \
  --expected-receipt-sha256 1a49a60909258b542c7f4899e6378fa9f10c1cea08ef1aaf4b5366480dbf71b7 \
  --audit-tool /workspace/g350-linux-handheld/cloud/audit-installed-dependencies.py
```

The trusted receipt binds archive `installed-node-modules.tar.gz` SHA256 `a5122317cc21862873121f8ddefa2ec605cf36c67ec9b688fd5d866391ea43ec`, full installed-tree SHA256 `47633d41b2b4d3f88c83a220327912b59445cdc4f301e4235393a6d5c910e9b6`, before/after manifest SHA256 `d63c5b0cd99e16523bc36c1939415dfa598e6cdf7a639ef6dc9e4a999d99d605`, and audit helper SHA256 `61f1410ddde649491049278dde0bbe44a05fa86f33cbeeb1c3910b1922f09b59`. The verifier source SHA256 is `749cad354ad094398790f31e3fef808e7fd3a2af1921ee25afe98e6490975523`.

This wrapper checks the pinned receipt, compressed archive size/hash, both manifest hashes and full tree identity, helper hash, then the existing installed tree's file bytes/types/modes/symlink targets. It performs no writes. The independent audit streamed all 9,683 archive members (8,496 files, 1,158 directories, 29 internal links), checked every payload/hash/mode/link target and safe self-contained closure, with no exclusions or external links. Missing or differing state fails verification; it is not silently overwritten.

The archive is a content snapshot in the reusable prepared filesystem, under ignored bus `.cache`; it is not a lockfile, source revision or Git artifact. Keep its receipt, both manifests and archive together at their recorded paths. The separate KiCad container/archive under board `.cloud-tools` is unchanged. The tree manifest includes absolute resolved paths, so this check supports the recorded `/workspace/bus-lanes-solver/node_modules` location; relocation requires a separately reviewed explicit path mapping. No restore operation is provided by these helpers.

The fresh source prepare-only audit binds revision `7d5d73fa739d7d48e7bef4c13217d98c8ecc27f9`, library tree `8b126296de1b027322d20193bcaaa54ac807812e`, all eleven trusted input/fixed-copper/cap records and 24 direct package/entry fingerprints to this full archived tree. It ran no solver steps. Historical 73ef043 runs recorded those 24 direct fingerprints and the fanout identity, but did not record a full installed-tree hash at run start. This later snapshot does not retroactively give those historical runs a full-tree attestation.

Tests reject wrong or tampered receipt hashes, tampered manifests, corrupted or missing archives, a changed helper, and toy installed file/content/mode/symlink changes. Tests modify only disposable `/tmp` fixtures. The final board-path verifier and audit-helper chain passed after sourcing `cloud/env.sh`; its raw result is `cloud/artifacts/bus-lanes-dependency-preservation-final-path-2026-10-12.json`.

This verification establishes no hardware routing result or fabrication readiness. Main source, board runtime, installed dependencies, frozen evidence and the old 73ef043 packet/archive were not changed.
