import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {checkEachPcbPortConnectedToPcbTraces,runAllRoutingChecks} from '@tscircuit/checks'

const circuitPath='dist/g350-ddr-power-replay-six-via-repairs/compiled.circuit.json'
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const circuit=read(circuitPath)
const all=await runAllRoutingChecks(circuit)
const types=all.reduce((r,e)=>{r[e.type]=(r[e.type]??0)+1;return r},{})
assert.deepEqual(types,{pcb_port_not_connected_error:829,pcb_trace_missing_error:119})
const before=checkEachPcbPortConnectedToPcbTraces(circuit)
const port=circuit.find(e=>e.type==='pcb_port'&&e.pcb_port_id==='pcb_port_0')
assert(port)
const trace=circuit.find(e=>e.type==='pcb_trace'&&e.route.some(p=>p.start_pcb_port_id===port.pcb_port_id))
assert(trace)
assert(!before.some(e=>e.pcb_port_ids?.includes(port.pcb_port_id)))
const severed=circuit.filter(e=>e!==trace)
const after=checkEachPcbPortConnectedToPcbTraces(severed)
assert.equal(after.length,before.length+1)
const added=after.filter(e=>e.pcb_port_ids?.includes(port.pcb_port_id))
assert.equal(added.length,1)
assert.match(added[0].message,/U_SOC\.A1.*GND/)
const report={status:'PASS_DEGENERATE_COPPER_CONTACT_AND_DISCONNECTION_CONTROL',
 circuit:artifact(circuitPath),checker:artifact('node_modules/@tscircuit/checks/dist/index.js'),
 patch:artifact('scripts/patch-tscircuit-via-pad-check.mjs'),
 nativeRoutingErrorTypes:types,zeroLengthEdgesHandled:true,
 removedTraceId:trace.pcb_trace_id,newlyDisconnectedPort:port.pcb_port_id,
 negativeControlError:added[0],fabricationReady:false,
 scope:'Direct routing-check regression on real saved copper; expected unfinished-board opens remain. A removed CPU ground trace must still fail connectivity.'}
writeFileSync('checks/integrated/g350-ddr-bootstrap/copper-contact-regression.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,nativeRoutingErrorTypes:types,negativeControl:added[0].message}))
