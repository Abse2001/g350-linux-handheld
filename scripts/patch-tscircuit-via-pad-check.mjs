import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'

// @tscircuit/checks 0.0.242 exposes the board's separate via-to-pad rule,
// but checkViaPadClearance incorrectly reads only the SMT pad-to-pad rule.
// Correct that lookup; retain all checks, the explicit override, and the
// original SMT-rule fallback for boards without a via-specific rule.
const root='node_modules/@tscircuit/checks'
const pkg=JSON.parse(readFileSync(`${root}/package.json`,'utf8'))
assert.equal(pkg.version,'0.0.242','Review the upstream fix before applying this patch to another release')
const path=`${root}/dist/index.js`
const original='const requiredClearance = minClearance ?? getBoardDrcValue(board, "min_pad_edge_to_pad_edge_clearance") ?? jlcMinTolerances.min_pad_edge_to_pad_edge_clearance;'
const corrected='const requiredClearance = minClearance ?? getBoardDrcValue(board, "min_via_edge_to_pad_edge_clearance") ?? getBoardDrcValue(board, "min_pad_edge_to_pad_edge_clearance") ?? jlcMinTolerances.min_pad_edge_to_pad_edge_clearance;'
let source=readFileSync(path,'utf8')
const alreadyPatched=source.includes(corrected)
assert(alreadyPatched||source.split(original).length===2,'Unexpected via-pad checker source')
if(!alreadyPatched){source=source.replace(original,corrected);writeFileSync(path,source)}
// Saved fanout paths include coincident wire endpoints around a via. Their
// copper polygons can contain zero-length edges. Flatten's segment-to-arc
// distance throws on such edges; use the equivalent point distance instead
// so plane connectivity completes rather than abandoning every routing check.
const contactOriginal='if (edge.distanceTo(candidate.shape)[0] <= tolerance) return true;'
const contactCorrected=`const contactDistance = edge.length < 1e-6
          ? candidate.shape.length < 1e-6
            ? edge.start.distanceTo(candidate.shape.start)[0]
            : edge.start.distanceTo(candidate.shape)[0]
          : candidate.shape.length < 1e-6
            ? candidate.shape.start.distanceTo(edge)[0]
            : edge.distanceTo(candidate.shape)[0];
        if (contactDistance <= tolerance) return true;`
assert(source.includes(contactCorrected)||source.split(contactOriginal).length===2,'Unexpected copper-contact checker source')
if(!source.includes(contactCorrected)){source=source.replace(contactOriginal,contactCorrected);writeFileSync(path,source)}
console.log(`Verified @tscircuit/checks ${pkg.version} via-pad rule lookup (${alreadyPatched?'already corrected':'corrected'}); SHA256 ${createHash('sha256').update(source).digest('hex')}`)
