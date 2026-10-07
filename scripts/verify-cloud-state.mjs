import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {Circuit as CoreCircuit, SOLVERS} from '@tscircuit/core'
import {Circuit} from 'tscircuit'
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const pkg = read('package.json')
for (const [name, version] of Object.entries(pkg.devDependencies))
  assert.equal(read(`node_modules/${name}/package.json`).version, version, `${name} version drift`)
assert.equal(Circuit, CoreCircuit)
for (const name of ['BusLanesSolver','BusLanesPipelineSolver','DogboneFanoutSolver'])
  assert.equal(typeof SOLVERS[name], 'function', `Missing native ${name}`)
assert.equal(sha('node_modules/@tscircuit/checks/dist/index.js'), '1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc', 'Native checks patch/build drift')
const expected = '01815364357e0354de1089af4253e2ce2dc926f822b5f173b7ccb133e459f555'
for (const p of ['dist/g350-current-index-byte0-handoff-fixed/compiled.circuit.json','dist/index/circuit.json'])
  assert.equal(sha(p), expected, `Current frozen circuit changed: ${p}`)
assert.equal(read('design-status.json').fabricationReady, false)
console.log('Pinned packages, shared core, native DDR solvers, patched checks and frozen current board verified')
