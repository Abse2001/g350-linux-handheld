# CPU clock escape: original Grid diagnostic

The original Bus Lanes Grid found a **7.115339 mm, 99-node local CPU34 escape** in the captured C obstacle scene. It solved naturally after 125,271 expansions. A separate manual five-segment escape also passed the original continuous visibility checks at 7.441163 mm. These results explain a previously unresolved CPU-end search; they do not complete a CPU-to-RAM clock pair or the 49 DDR signals. `fabricationReady=false`.

This follows the user's current custom arrangement allowing DDR on all four copper layers, with reference planes to be redesigned. CPU34 runs on Inner1 in this diagnostic. TI's literal four-layer arrangement reserves the inner layers for references; the custom arrangement still requires verified continuous adjacent references, return paths and impedance.

Root session 41605 ran one fresh original Grid under Bun 1.3.14, importing the exact private runtime TypeScript directly. Constructor mode, 641 × 891 grid, phase, goal and eight attachments at each end matched the actual captured state before the first step. The search started at zero, used the original 500,000-expansion cap, installed no observer hooks, replayed no frontier and invoked no native checker. Termination was classified before the original cancel call. Material, all 167 original copper obstacles, source and installed SDK held. The collected scope exited 0 in 1.090883 s, peaked at 134,836,224 owned RSS bytes, had zero OOM deltas and left its process group empty. This elapsed time is descriptive, not a comparison against the public Node worker.

The start is `(-4, 12.8)`; the target `(-3.59845256864453, 9.85525256864453)` is a captured virtual handoff point, not a RAM contact. The raw original constructor argument list was not retained. The verified replay recreates its observed mode, not a raw argument or frontier replay. The natural result's full 99-node geometry is retained and passes the original whole-path continuous visibility check. The manual alternative uses a separate cloned input/scene; all five segments and the whole path pass independently without priming or controlling the fresh Grid.

The captured input predates the newer jointly checked **101 package approaches and 64 capacitor loops**. Those additional reference vias and stubs must be included before accepting either local escape. The current combined scene is under construction; these old-scene candidates need requalification against that scene. No native acceptance is inferred from a static distance calculation. The newer local package source/CAD proof and this local routing diagnostic must not be combined into a claimed connected board.

| Exact retained evidence | SHA256 |
| --- | --- |
| Captured CPU obstacle scene | `6bca749985625ab2fc0de67563aa4031e7527f7951b35b4725f1bb5b33eeb0c8` |
| Actual diagnostic result | `21063427cf61345df1bf21804a41f9cbf78335b9f79952fdc40fc2a983ba4a0b` |
| Full solved local path | `d1b7ad894987dd17b9ae8e797e4536d3bd918b004fb2456fcc1420607efd0c1f` |
| Collected Root session | `4d55c532cc320dbfc74a50423525706c7f9378ed6bcfacb5c753a52628b27b0d` |
| Diagnostic post-audit | `ca229b6415ab34cee2765932277dc367f64d8ef69ff74feee3fb46ab0c602376` |

The adjacent DATA archive preserves the actual result/path, captured scene, replay source, all 128 runtime files and bound data via this payload and exact named prior archives, and the 12 transitive original Grid import source files. It omits installed SDK binaries, Bun/Node binaries, numerical wheels/models, images and Root authorization tokens. It restores evidence data only and does not grant authority to run an archived guard. A future execution needs verified pinned tools/dependencies, operational bindings and a fresh Root authorization.

The data archive contains **229 regular files**, 3,807,758 logical bytes and 615,278 compressed bytes (SHA256 `c4d249fa7869e39333a917ba05986da9f633b0af62e35ee83c7768bcd965b226`). Nine exact named DATA entries are reused from the two prior archives listed in its manifest. Payload hash/size/mode readback passed during stdlib packaging. The safe restorer differs from the tested package101 CAD helper only by its exact destination allowlist; inverse source comparison passed. Root independently tested fresh restoration of all229 files and their hash/size/mode, repeat restoration with0 created, verify-only, refusal of differing data before writes, symlink-parent refusal and live verify-only of229 exact files with0 created. These DATA checks passed; see cloud/TI_DDR_CPU34_GRID_DATA_RESTORE_VALIDATION_2026-10-14.json. No archived application was executed. An empty temporary workspace is recommended for portable inspection; archived source modes remain exact.

```bash
source /workspace/g350-linux-handheld/cloud/env.sh
cd /workspace/g350-linux-handheld
replay_evidence_target=$(mktemp -d /tmp/g350-cpu34-replay-data.XXXXXX)
python3 scripts/restore-g350-cpu34-replay-evidence.py \
  --manifest cloud/artifacts/g350-ti-ddr-cpu34-original-grid-replay-evidence-2026-10-14.manifest.json \
  --manifest-sha256 9bcf2109c00b889b96bf32d9ad51239a277b691386283b75e4ab78120ad1ce12 \
  --archive cloud/artifacts/g350-ti-ddr-cpu34-original-grid-replay-evidence-2026-10-14.tar.gz \
  --workspace "$replay_evidence_target" --restore
```

The manifest SHA256 is `9bcf2109c00b889b96bf32d9ad51239a277b691386283b75e4ab78120ad1ce12`. This command restores this payload only. Prior named archives and operational tools/dependencies are still needed to execute original guards. No archived application or restore helper was executed during packaging. No board source was rerouted or exported for this persistence work. Board branch HEAD at preparation was `e80423b96bdd88d0806ab6e9f1b62b8586389ef8`; the separate all-eleven candidate session 42982 was pending and contributes no passing claim here.

Next work is to reproduce both clock legs against the newer combined package/signal copper, pass unchanged native checks and pair/bus-length constraints, then finish all 49 interconnects, redesigned references and supply distribution. Electrical timing, impedance, full-board DRC and exact shell fit remain open. Frozen hardware evidence is preserved; the board is not ready to order.
