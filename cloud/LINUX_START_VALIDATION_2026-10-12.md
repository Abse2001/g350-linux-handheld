# Reusable Linux Start validation

The saved Start block passed on Debian 13 on 2026-10-12. It sources `cloud/env.sh`, fetches and fast-forwards `codex/cloud-handoff`, checks the exact pushed Bus Lanes source `c1151212be7b9de4b34b07436d135d874e6c0466`, verifies the complete installed dependency tree/archive, performs the prepare-only fixture audit, and runs `cloud/START_OUTER_DDR_RUNTIME_2026-10-11.sh`. No board routing ran.

The only executable Start change is storing its prepare-only audit under ignored `.cloud-tools/start-validation` instead of ephemeral `/tmp`. Current continuation instructions also refer to `cloud/DDR_SOLVER_STATUS_2026-10-12.md` and distinguish the proposed, unadopted solver work from production source.

Actual exit was zero after 136.459 seconds. The owned process group exited cleanly; peak RSS was 262,397,952 bytes, with no new OOM events. All 9,696 board and 1,058 solver tracked/nonignored file hashes, branch names and HEADs remained unchanged. The pinned complete Node dependency archive and installed tree matched before and after. Evidence hash checks passed; the restored historical 22-channel checkpoint remains explicitly incomplete and does not replace newer local 26-channel work.

Verified tools: Node 25.6.1, Bun 1.3.14, KiCad CLI/pcbnew 10.0.6, wxPython 4.2.5, Python 3.12.14 for the auxiliary routing tools, NumPy 2.3.5, SciPy 1.17.0, Shapely 2.1.2, GEOS 3.13.1 and Debian g++ 14.2.0-19. Four auxiliary routing-tool smoke checks passed. The board remains on tscircuit 0.0.2821 and its reviewed core/checker/solver pins and native checks patch. Frozen KiCad 10 evidence was preserved.

Raw validation is retained in ignored `.cloud-tools/current-start-validation-20261012/`. Report SHA-256: `b2a481d24b11ca7cdbbca62544675539ca2bdee36602e45ba9b3ca4aab055b80`; tested Start text: `a2b38209b7f04d331360e197a0aa015f2b9c60b0b6fd42571ce3d384bf509dd8`; executable block: `5e0c5449ae68f0da674ee11d0d355cad2cb13a9e381cda933a1cec3462927cde`. The ignored KiCad image/archive and dependency archive remain in the prepared filesystem, with source scripts to verify or reconstruct them.

The tested Start was saved and read back as environment draft revision 40. All twelve repository declarations, ten custom network domains and the 646-byte Install script were preserved exactly. The Install script was not rerun during this validation; its earlier setup validation remains recorded in the project. The draft requires Review, Save and Publish in environment settings to activate; saving a draft is not publication or proof of restoration in a separate task.

The reusable environment is prepared for publication. DDR49, full-board routing, electrical timing and mechanical fit are unfinished; the hardware is not ready to order and `fabricationReady=false`.
