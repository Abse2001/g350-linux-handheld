# Exporting preserved physical via spans

After the existing Start commands, run `bash cloud/START_CLI_PHYSICAL_VIAS_2026-10-13.sh`. It sources `cloud/env.sh` and prepares or verifies a separate reviewed exporter under ignored `.cloud-tools/cli-physical-vias`. Its JSON result returns `cliEntry`. Use that entry with pinned local Bun for selected KiCad exports. Setup prepares the same copy after the pinned Bun installation. Installed CLI/Core, lockfiles and reviewed native checks remain unchanged.

```bash
cd /workspace/g350-linux-handheld
source cloud/env.sh
g350_cli_copy_json=$(python3 scripts/prepare-isolated-cli-physical-vias.py \
  --cli-package-directory node_modules/@tscircuit/cli \
  --output-directory .cloud-tools/cli-physical-vias)
g350_cli_export_entry=$(python3 -c 'import json, sys; print(json.load(sys.stdin)["cliEntry"])' <<< "$g350_cli_copy_json")
.cloud-tools/bun/node_modules/bun/bin/bun.exe "$g350_cli_export_entry" \
  export new-input.circuit.json --format kicad_pcb --output new-output.kicad_pcb
```

Input/output filenames above are placeholders for new experiment paths. Do not overwrite frozen evidence. Use the existing checkout; no worktree is needed. The copied CLI entry is for exports; it does not replace the installed runtime or global CLI selection.

The helper supports exactly the reviewed CLI 0.1.2258 package/bundle hashes. It preserves explicit physical route layers. When Core has omitted those layers from a logical route point, it uses the existing native pcb_via only when known ownership, exact XY, explicit projected dimensions and physical span uniquely match. Ambiguity is refused. Foreign-net or different-dimension records are retained separately; unknown net0 ownership is never a match. Route-only fallback remains unchanged. No input JSON is normalized and no via is forced to span all four layers.

The helper reconstructs exact tested bundles and retains the installed dependency resolver order. It refuses unknown sources, altered copied output and output inside installed node_modules. Repeating preparation verifies the existing copy; `--verify-only` requires it to exist. Runtime pins and physical checks must remain in force when qualifying board exports.

Read `cloud/CLI_PHYSICAL_VIA_LINUX_VALIDATION_2026-10-13.md`. The actual Core-to-CLI-to-KiCad tiny fixture passes. These focused checks do not establish full DDR routing, electrical timing, reference-plane compliance or fabrication readiness.
