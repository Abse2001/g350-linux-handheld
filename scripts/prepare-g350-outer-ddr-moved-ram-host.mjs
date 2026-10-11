// Explicitly open planning host for authorized RAM placement changes.
// Removed RAM reference copper must be rebuilt and independently qualified.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,root,xText='0',yText='6',rotationText='90']=process.argv.slice(2)
assert(input&&root&&!fs.existsSync(root))
const x=Number(xText),y=Number(yText),rotation=Number(rotationText);assert(Number.isFinite(x)&&Number.isFinite(y)&&[0,90,180,270].includes(rotation))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),inputSha=hash(input)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const ram=base.find(e=>e.type==='pcb_component'&&base.some(s=>s.type==='source_component'&&s.name==='U_RAM'&&s.source_component_id===e.source_component_id));assert(ram)
const ramPorts=new Set(base.filter(e=>e.type==='pcb_port'&&e.pcb_component_id===ram.pcb_component_id).map(e=>e.pcb_port_id))
const turn=(rotation-ram.rotation+360)%360,move=p=>{let a=p.x-ram.center.x,b=p.y-ram.center.y;for(let i=0;i<turn/90;i++)[a,b]=[-b,a];return {...p,x:a+x,y:b+y}}
const ids=new Set(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id));assert.equal(ids.size,49)
const ddr=base.filter(e=>e.type==='pcb_trace'&&ids.has(e.source_trace_id));assert.equal(ddr.length,49)
const ramPads=base.filter(e=>e.type==='pcb_smtpad'&&e.pcb_component_id===ram.pcb_component_id)
const references=base.filter(e=>e.type==='pcb_trace'&&!ids.has(e.source_trace_id)&&e.route.some(p=>p.route_type==='wire'&&p.layer==='top'&&ramPads.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<1e-8)))
assert.equal(references.length,36)
const removedTraceIds=new Set([...ddr,...references].map(t=>t.pcb_trace_id)),removedViaIds=new Set(base.filter(e=>e.type==='pcb_via'&&removedTraceIds.has(e.pcb_trace_id)).map(v=>v.pcb_via_id))
const changedRecord=e=>e.pcb_component_id===ram.pcb_component_id&&(['pcb_component','pcb_port','pcb_smtpad'].includes(e.type)||e.type.startsWith('pcb_silkscreen')||e.type.startsWith('pcb_courtyard'))
const transform=e=>{
 if(e.type==='pcb_component'&&e.pcb_component_id===ram.pcb_component_id){const out=structuredClone(e);out.center={x,y};out.rotation=rotation;if(turn%180)[out.width,out.height]=[out.height,out.width];out.display_offset_x=x;out.display_offset_y=y;return out}
 if(!changedRecord(e))return structuredClone(e)
 let out=structuredClone(e)
 if(Number.isFinite(out.x)&&Number.isFinite(out.y))out=move(out)
 if(out.center)out.center=move(out.center)
 if(out.points)out.points=out.points.map(move)
 if(out.route)out.route=out.route.map(move)
 if(Number.isFinite(out.ccw_rotation))out.ccw_rotation=(out.ccw_rotation+turn)%360
 if(Number.isFinite(out.rotation))out.rotation=(out.rotation+turn)%360
 if(turn%180&&Number.isFinite(out.width)&&Number.isFinite(out.height))[out.width,out.height]=[out.height,out.width]
 return out
}
const open=base.filter(e=>!(e.type==='pcb_trace'&&removedTraceIds.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&removedViaIds.has(e.pcb_via_id))).map(transform)
const parent=new Map(),find=a=>{if(!parent.has(a))parent.set(a,a);if(parent.get(a)!==a)parent.set(a,find(parent.get(a)));return parent.get(a)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
// Native checks may annotate route endpoint IDs. Check an isolated copy so
// existing authored outside copper and metadata stay byte-for-byte unchanged.
const checked=structuredClone(open)
const counts=Object.fromEntries(g350DdrPhysicalChecks.map(n=>[n,checks[n](checked).length]));counts.manufacturing=checkG350ViaTrackManufacturingClearance(checked.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length
const movedRam=open.find(e=>e.type==='pcb_component'&&e.pcb_component_id===ram.pcb_component_id)
const bodyCollisions=open.filter(e=>e.type==='pcb_component'&&e.pcb_component_id!==ram.pcb_component_id&&e.layer===ram.layer&&!e.do_not_place&&!e.is_allowed_to_be_off_board&&Math.abs(e.center.x-x)<(movedRam.width+e.width)/2&&Math.abs(e.center.y-y)<(movedRam.height+e.height)/2).map(e=>({pcb_component_id:e.pcb_component_id,name:base.find(s=>s.type==='source_component'&&s.source_component_id===e.source_component_id)?.name}))
const untouched=e=>!changedRecord(e)&&!(e.type==='pcb_trace'&&removedTraceIds.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&removedViaIds.has(e.pcb_via_id))
assert.deepEqual(open.filter(untouched),base.filter(untouched))
const physicalPassed=Object.values(counts).every(n=>n===0)&&bodyCollisions.length===0
fs.mkdirSync(root);fs.copyFileSync('scripts/prepare-g350-outer-ddr-moved-ram-host.mjs',root+'/helper.executed.mjs')
fs.writeFileSync(root+'/open-planning.circuit.json',JSON.stringify(open,null,2)+'\n')
// Placeholder DDR records only provide updated pad endpoints to downstream planners.
// Their unchanged middle copper is not legal and must be completely removed by the planner.
const donor=[...open,...ddr.map(t=>{const out=structuredClone(t);for(const i of [0,out.route.length-1])if([out.route[i].pcb_port_id,out.route[i].start_pcb_port_id,out.route[i].end_pcb_port_id].some(id=>ramPorts.has(id)))out.route[i]=move(out.route[i]);return out})]
fs.writeFileSync(root+'/incomplete-routing-input.circuit.json',JSON.stringify(donor,null,2)+'\n')
assert.equal(hash(input),inputSha)
const report={input:{path:input,sha256:inputSha},placement:{x,y,rotation},counts,bodyCollisions,physicalPassedOnOpenGeometryOnly:physicalPassed,missingDdrCarriers:49,missingRamReferenceTraces:references.map(t=>t.pcb_trace_id),removedOnlyOwnedViaIds:[...removedViaIds],allOutsideCopperLogicAndOtherPlacementsExactlyPreserved:true,requiresReferenceRebuildAndCompleteEditableSourceAndIndependentQualification:true,noCandidatePromoted:true,fabricationReady:false}
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=physicalPassed?0:2
