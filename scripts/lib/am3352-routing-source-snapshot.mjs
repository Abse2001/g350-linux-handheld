import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// CLI build paths are mutable. Preserve the exact observed input via its
// immutable RAM-power snapshot when a later build replaces that path.
export const readRoutingSourceSnapshot=observed=>{
  const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
  let path=observed.path
  if(hash(path)!==observed.sha256)path='dist/diagnostics/am3352-ram-bypass/circuit.json'
  assert.equal(hash(path),observed.sha256,'The exact observed routing source must still be available')
  return {circuit:JSON.parse(readFileSync(path)),source:{...observed,path,originalBuildPath:observed.path}}
}
