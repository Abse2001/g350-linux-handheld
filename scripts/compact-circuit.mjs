import {readFileSync,writeFileSync} from "node:fs"
import {isDeepStrictEqual} from "node:util"

// Registry uploads wrap text in JSON. Remove formatting whitespace before
// qualification; preserve every value, trace, footprint and warning record.
const path="dist/index/circuit.json"
const original=readFileSync(path)
const circuit=JSON.parse(original)
const compact=JSON.stringify(circuit)+"\n"
if(!isDeepStrictEqual(circuit,JSON.parse(compact)))
  throw new Error("Circuit compaction changed data")
writeFileSync(path,compact)
console.log(`Circuit formatting compacted: ${original.length} -> ${Buffer.byteLength(compact)} bytes; all parsed data unchanged.`)
