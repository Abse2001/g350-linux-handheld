# DDR bus lanes continuation — 2026-10-06

The active runtime is tscircuit 0.0.2745 / core 0.0.2095, with the reviewed
checks 0.0.240 patch verified. The DDR diagnostics use the bundled native
`SOLVERS.BusLanesSolver`; upstream inspection checkouts are not substituted.

The preparation helper now accepts bounded, validated native search options.
Changing an endpoint to Top requires a same-net, coincident physical
Top-to-Bottom through-via in the fixed trace input. Manufacturing clearances,
four copper layers, fixed byte0/power copper, 0.635 mm complete-byte skew and
0.127 mm strobe-pair skew remain enforced.

Two fresh experiments retain the seeded strobes and saved D8/D9 carriers:

- `dist/g350-byte1-linux-smooth-20261006`: remaining seven carriers on Bottom,
  with smooth tuning enabled.
- `dist/g350-byte1-linux-top-fixed-two-20261006`: remaining seven carriers on
  Top through verified existing via access, with smooth tuning enabled.

Each preparation passes all ten native physical preflight checks. Each run
records hashed inputs, options, executed helpers and actual runtime binaries.
See its `result.json` and `solver-result.json` for the authoritative outcome.
A failed or partial prepared solve adds no qualified connected signals and
must not be promoted to the default without actual shaped-source replay and
complete independent checks.

Validation: runtime/hash assertions, TypeScript typecheck, helper syntax and
`git diff --check` pass. Frozen default and seeded source SHA256 remain
01815364357e0354de1089af4253e2ce2dc926f822b5f173b7ccb133e459f555 and
422b953063e3e6b92502f0a8376f092d397923ca405eed978ba40c664509734a.

The accepted default remains 11/49 DDR signals. The independently scoped seeded
candidate has 13/49, not a complete byte1. Fabrication readiness remains false.
Full board connectivity, DDR electrical timing/stackup and measured original
shell fit remain release gates. No fabrication publication or order is authorized.

## Executed outcomes

- `dist/g350-byte1-linux-smooth-20261006`: NATIVE_SOLVER_FAILED; search_budget_exhausted; 50000 iterations; 114.09 seconds; partial snapshot sizes []; no complete output.
- `dist/g350-byte1-linux-top-fixed-two-20261006`: NATIVE_SOLVER_BUDGET_EXPIRED; search_budget_exhausted; 35084 iterations; 120.02 seconds; partial snapshot sizes [1]; no complete output.

Neither attempt qualifies additional channels. Preserve these failed runs; the next
carrier strategy needs a changed corridor/escape geometry and source replay,
rather than repeating the same search unchanged. Changes remain local because
no routing breakthrough was verified.
