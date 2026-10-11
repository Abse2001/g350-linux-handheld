// Guarded replacement for the ODT CPU approach; local fanout qualification only.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350HardSceneShapes} from './lib/g350-hard-scene-shapes.mjs'
import {routeGuardedOuterBridge} from './lib/g350-ddr-timing-detour-bridge.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,reference,root]=process.argv.slice(2);assert(input&&reference&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),hashes=[input,reference].map(hash)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),ref=JSON.parse(fs.readFileSync(reference))
const ddr=new Map(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>[e.source_trace_id,e.name]));assert.equal(ddr.size,49)
const old=base.filter(e=>e.type==='pcb_trace'&&ddr.has(e.source_trace_id)),ids=new Set(old.map(e=>e.pcb_trace_id));assert.equal(old.length,49)
const fixed=base.filter(e=>!(['pcb_trace','pcb_via'].includes(e.type)&&ids.has(e.pcb_trace_id)))
const heads=ref.filter(e=>e.type==='pcb_trace'&&ddr.has(e.source_trace_id));assert.equal(heads.length,49)
const odt=heads.find(t=>ddr.get(t.source_trace_id)==='DDR_ODT');assert(odt)
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const otherIds=new Set(heads.filter(t=>t!==odt).map(t=>t.pcb_trace_id)),reserved=ref.filter(e=>['pcb_trace','pcb_via'].includes(e.type)&&otherIds.has(e.pcb_trace_id)),scene=structuredClone([...fixed,...reserved])
fs.mkdirSync(root);for(const path of ['scripts/repair-g350-near-cpu-odt-guarded.mjs','scripts/lib/g350-hard-scene-shapes.mjs','scripts/lib/g350-ddr-timing-detour-bridge.mjs'])fs.copyFileSync(path,root+'/'+path.split('/').at(-1))
const trials=[];let accepted=null
for(const [i,x]of [-3,0,3].entries()){
 const start=old.find(t=>t.source_trace_id===odt.source_trace_id).route[0],goal={x,y:11,layer:'bottom'}
 const result=routeGuardedOuterBridge({connection:{name:find(odt.source_trace_id),pointsToConnect:[start,goal]},shapes:g350HardSceneShapes(scene,find,['top','bottom']),searchBounds:{minX:-6,maxX:6,minY:10,maxY:16},seconds:30,gridMm:.025,maxVias:2,viaGrid:.025,routingLayers:['top','bottom'],viaCopperClearance:.254,primaryTerminalLayer:true,pruneDominatedViaStates:true,guardNonterminalOwnVias:true})
 const record={i,goal,found:Boolean(result.route),error:result.error??null,expanded:result.expanded};trials.push(record)
 if(result.route){
  const first=result.route.findIndex(p=>p.route_type==='via');assert(first>0);const route=structuredClone(result.route.slice(0,first+1));route[0]=structuredClone(start);const v=route.at(-1);route.push({route_type:'wire',x:v.x,y:v.y,layer:'bottom',width:.1016})
  const t={...structuredClone(odt),route};delete t.trace_length
  const output=[...scene,t,{type:'pcb_via',pcb_via_id:t.pcb_trace_id+'_guarded_via',pcb_trace_id:t.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:t.subcircuit_id}]
  assert.deepEqual(output.slice(0,fixed.length),fixed)
  const c=structuredClone(output),details=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTraceViaCounts','checkPcbTracesOutOfBoard','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c)]));details.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e))
  record.counts=Object.fromEntries(Object.entries(details).map(([n,e])=>[n,e.length]));record.details=details;record.passed=Object.values(record.counts).every(n=>n===0);record.searchedRoute=result.route
  fs.writeFileSync(root+'/trial-'+i+'.circuit.json',JSON.stringify(output,null,2)+'\n')
  if(record.passed){accepted=i;fs.writeFileSync(root+'/physical-only-cpu-escapes.circuit.json',JSON.stringify(output,null,2)+'\n')}
 }
 fs.writeFileSync(root+'/trial-'+i+'.json',JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({i,found:record.found,error:record.error,counts:record.counts,passed:record.passed}));if(accepted!==null)break
}
assert.deepEqual([input,reference].map(hash),hashes)
fs.writeFileSync(root+'/report.json',JSON.stringify({input,reference,hashes,trials,accepted,all49CpuEscapesPhysicalPassed:accepted!==null,changedOnlyDdrApproach:'DDR_ODT',completeDdrCarriers:0,referenceReconnectionAndSourceMatchingGroundAndCadUnqualified:true,fabricationReady:false},null,2)+'\n');process.exitCode=accepted===null?2:0
