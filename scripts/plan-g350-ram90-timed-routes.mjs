import fs from 'node:fs'
import assert from 'node:assert/strict'
import * as checks from '@tscircuit/checks'
import {routeGuardedOuterBridge} from './lib/am3352-command-terminal-bridge.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
import {normalizeG350DdrRoute} from './lib/g350-ddr-normalize-route.mjs'
import {tuneOneG350DdrTrace,ddrRouteLength} from './lib/g350-ddr-trace-tuning.mjs'
import {g350PlanningTimingFits} from './lib/g350-ddr-planning-timing.mjs'
import {g350BgaEscapeRegions} from './lib/g350-ddr-bga-escape-regions.mjs'
import {repairG350TerminalStaircases} from './lib/g350-ddr-terminal-staircases.mjs'
const [base,root,prior]=process.argv.slice(2);assert(base&&root&&!fs.existsSync(root));fs.mkdirSync(root)
fs.writeFileSync(`${root}/planner.executed.mjs`,fs.readFileSync('scripts/plan-g350-ram90-timed-routes.mjs'))
const read=p=>JSON.parse(fs.readFileSync(p)),prep=read(`${base}/preparation.json`);assert.equal(prep.physicalErrors,0)
let circuit=read(`${prior??base}/candidate.circuit.json`).filter(r=>!r.type.includes('error'))
const input=read(`${base}/solver-input.json`),connections=read(`${base}/all-ddr-connections.json`)
const targets=fs.existsSync(`${base}/targets.json`)?read(`${base}/targets.json`):{byte0:34,byte1:34,command:37.2,reset:34}
const names=new Map(circuit.filter(r=>r.type==='source_trace').map(r=>[r.source_trace_id,r.name]))
const priority=process.env.G350_DDR_PRIORITY?.split(',')??['DDR_CKE','DDR_D6','DDR_D12','DDR_DQM0','DDR_A0','DDR_A1','DDR_A11','DDR_A12','DDR_A4','DDR_D2','DDR_D8','DDR_D3']
const rasterGuardMm=process.env.G350_RASTER_GUARD_MM===undefined?undefined:Number(process.env.G350_RASTER_GUARD_MM)
const only=process.env.G350_DDR_ONLY?.split(',')
const protectEscapeRegions=process.env.G350_PROTECT_BGA==='1'
const commandOuterFirst=process.env.G350_COMMAND_OUTER_FIRST==='1'
const directAllPads=process.env.G350_DIRECT_PADS==='1'
const directNames=process.env.G350_DIRECT_NAMES?.split(',')??[]
const searchSeconds=Number(process.env.G350_ROUTING_SECONDS??15)
assert(searchSeconds>0&&searchSeconds<=60)
const requestedLayers=process.env.G350_ROUTING_LAYERS?.split(',')
if(requestedLayers)assert(requestedLayers.length>=2&&requestedLayers.length<=4&&new Set(requestedLayers).size===requestedLayers.length&&requestedLayers.every(l=>['top','inner1','inner2','bottom'].includes(l)))
fs.writeFileSync(`${root}/planning-settings.json`,JSON.stringify({priority,targets,rasterGuardMm,only,protectEscapeRegions,commandOuterFirst,directAllPads,directNames,searchSeconds,requestedLayers,fabricationReady:false},null,2)+'\n')
connections.sort((a,b)=>{const rank=c=>{const i=priority.indexOf(names.get(c.name));return i<0?100:i};return rank(a)-rank(b)})
const solved=prior?read(`${prior}/solved.json`):fs.existsSync(`${base}/solved.json`)?read(`${base}/solved.json`):[],attempts=[]
const physical=c=>g350DdrPhysicalChecks.flatMap(n=>checks[n](c)).concat(checkG350ViaTrackManufacturingClearance(c))
for(const connection of connections){
 if(solved.some(s=>s.name===names.get(connection.name)))continue
 if(only&&!only.includes(names.get(connection.name)))continue
 const name=names.get(connection.name),goal=/^DDR_D(?:[0-7]|QM0|QS0|QSn0)$/.test(name)?targets.byte0:/^DDR_D/.test(name)?targets.byte1:name==='DDR_RESETn'?targets.reset:targets.command
 const directPads=directAllPads||directNames.includes(name)
 if(!circuit.some(r=>r.type==='pcb_trace'&&r.source_trace_id===connection.name)){
  const baseCircuit=read(`${base}/candidate.circuit.json`)
  const prefixes=baseCircuit.filter(r=>r.type==='pcb_trace'&&r.source_trace_id===connection.name)
  assert.equal(prefixes.length,2)
  const prefixIds=new Set(prefixes.map(r=>r.pcb_trace_id))
  circuit.push(...structuredClone(prefixes),...structuredClone(baseCircuit.filter(r=>r.type==='pcb_via'&&prefixIds.has(r.pcb_trace_id))))
 }
 const originalEscapes=circuit.filter(r=>r.type==='pcb_trace'&&r.source_trace_id===connection.name)
 assert.equal(originalEscapes.length,2)
 const originalCpu=originalEscapes.find(t=>Math.hypot(t.route.at(-1).x-connection.pointsToConnect[0].x,t.route.at(-1).y-connection.pointsToConnect[0].y)<1e-8)
 const originalRam=originalEscapes.find(t=>t!==originalCpu)
 const escapeIds=new Set(originalEscapes.map(t=>t.pcb_trace_id))
 const planningCircuit=directPads?circuit.filter(r=>!((r.type==='pcb_trace'||r.type==='pcb_via')&&escapeIds.has(r.pcb_trace_id))):circuit
 let accepted=false
 const isByte1=/^DDR_D(?:8|9|1[0-5]|QM1|QS1|QSn1)$/.test(name)
 const layerChoices=requestedLayers?[requestedLayers]:[isByte1?['inner2','inner1','bottom','top']:['inner1','inner2','top','bottom'],...(/^DDR_D/.test(name)?[isByte1?['inner2','inner1']:['inner1','inner2'],['top','bottom'],['inner1','bottom'],['inner2','top'],['inner1','top'],['inner2','bottom']]:[['top','bottom'],['inner1','bottom'],['inner2','top'],['inner1','inner2'],['inner1','top'],['inner2','bottom']])]
 if(commandOuterFirst&&!/^DDR_D/.test(name))layerChoices.unshift(['top','bottom'])
 for(const layers of layerChoices){
  // A normalized all-top path may need no terminal barrel. Reserve physical
  // holes that still exist, rather than keeping removed planning-only holes.
  const shapes=input.obstacles.filter(o=>!o.obstacleId?.startsWith('ram90_via_')||planningCircuit.some(v=>v.type==='pcb_via'&&Math.hypot(v.x-o.center.x,v.y-o.center.y)<1e-8)).map(o=>({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.find(n=>connections.some(c=>c.name===n))}))
  if(protectEscapeRegions)for(const b of g350BgaEscapeRegions(circuit))shapes.push({kind:'rect',x:(b.minX+b.maxX)/2,y:(b.minY+b.maxY)/2,w:b.maxX-b.minX,h:b.maxY-b.minY,layers,owner:'PLANNING_BGA_ESCAPE_REGION',viaOnly:true})
  for(const t of planningCircuit.filter(r=>r.type==='pcb_trace'))for(let i=0;i<t.route.length;i++){
   const p=t.route[i],q=t.route[i-1],owner=t.source_trace_id
   if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:.4572,h:.4572,hole:.254,layers,owner})
   if(q&&p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer&&Math.hypot(p.x-q.x,p.y-q.y)>1e-8)shapes.push({kind:'segment',a:q,b:p,w:.1016,layers:layers.includes(p.layer)?[p.layer]:[],owner})
  }
  if(directPads&&!layers.includes('top'))continue
  const endpoints=directPads?[originalCpu.route[0],originalRam.route[0]]:connection.pointsToConnect
  const result=routeGuardedOuterBridge({connection:{...connection,pointsToConnect:endpoints.map(p=>({...p,layer:directPads?'top':layers[0]}))},shapes,searchBounds:input.bounds,seconds:searchSeconds,gridMm:.02,maxVias:6,viaGrid:.02,routingLayers:layers,viaCopperClearance:.1016,rasterGuardMm})
  if(!result.route){attempts.push({name,layers,error:result.error,expanded:result.expanded,startBlocked:result.startBlocked,goalBlocked:result.goalBlocked});continue}
  const c=structuredClone(circuit),escapes=c.filter(r=>r.type==='pcb_trace'&&r.source_trace_id===connection.name);assert.equal(escapes.length,2)
  const cpu=escapes.find(t=>Math.hypot(t.route.at(-1).x-connection.pointsToConnect[0].x,t.route.at(-1).y-connection.pointsToConnect[0].y)<1e-8),ram=escapes.find(t=>t!==cpu);assert(cpu&&ram)
  const head=structuredClone(cpu.route.slice(0,-1)),tail=structuredClone(ram.route.slice(0,-1)).reverse()
  head.at(-1).to_layer=result.route[0].layer
  tail[0]={...tail[0],from_layer:result.route.at(-1).layer,to_layer:'top'}
  tail.at(-1).end_pcb_port_id=tail.at(-1).start_pcb_port_id;delete tail.at(-1).start_pcb_port_id
  const t={type:'pcb_trace',pcb_trace_id:`timed_${name}`,source_trace_id:connection.name,subcircuit_id:cpu.subcircuit_id,route:[...head,...result.route,...tail]}
  if(directPads){t.route=result.route;t.route[0].start_pcb_port_id=cpu.route[0].start_pcb_port_id;t.route.at(-1).end_pcb_port_id=ram.route[0].start_pcb_port_id}
  const joinedRoute=structuredClone(t.route)
  t.route=normalizeG350DdrRoute(t.route)
  const oldIds=new Set(escapes.map(t=>t.pcb_trace_id));for(let i=c.length-1;i>=0;i--)if((c[i].type==='pcb_trace'&&oldIds.has(c[i].pcb_trace_id))||(c[i].type==='pcb_via'&&oldIds.has(c[i].pcb_trace_id)))c.splice(i,1)
  c.push(t)
  const addVias=()=>{for(const [i,v]of t.route.filter(p=>p.route_type==='via').entries())c.push({type:'pcb_via',pcb_via_id:`timed_${name}_${i}`,pcb_trace_id:t.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:t.subcircuit_id})}
  addVias()
  let mergedErrors=physical(c)
  if(mergedErrors.length){
   // A self-contact shortcut can cross unrelated copper even if the searched
   // path avoided it. Try the original geometry with only logical no-op vias
   // and duplicate wire points removed; all ten full checks still apply.
   t.route=joinedRoute.filter((p,i,r)=>!(p.route_type==='via'&&r[i-1]?.route_type==='wire'&&r[i+1]?.route_type==='wire'&&r[i-1].layer===r[i+1].layer))
   t.route=t.route.filter((p,i,r)=>!(i&&p.route_type==='wire'&&r[i-1].route_type==='wire'&&p.layer===r[i-1].layer&&Math.hypot(p.x-r[i-1].x,p.y-r[i-1].y)<1e-10))
   for(let i=c.length-1;i>=0;i--)if(c[i].type==='pcb_via'&&c[i].pcb_trace_id===t.pcb_trace_id)c.splice(i,1)
   addVias()
   mergedErrors=physical(c)
   if(mergedErrors.length&&repairG350TerminalStaircases(c,t,physical))mergedErrors=[]
  }
  if(mergedErrors.length){
   const rejected=`${root}/rejected-${name}-${attempts.length}`
   fs.writeFileSync(`${rejected}.circuit.json`,JSON.stringify(c,null,2)+'\n')
   fs.writeFileSync(`${rejected}.physical-errors.json`,JSON.stringify(mergedErrors,null,2)+'\n')
   attempts.push({name,layers,error:'Merged geometry failed physical checks',rejected,physicalErrors:mergedErrors.length});continue
  }
  const matchingRequired=c.some(r=>r.type==='source_bus'&&r.source_trace_ids.includes(t.source_trace_id)&&Number.isFinite(r.max_length_skew))
  const tuning=matchingRequired?tuneOneG350DdrTrace(c,t,goal,12,{protectEscapeRegions}):{found:true,unconstrainedBySource:true}
  // The tuner may add actual vias. Full native and manufacturing checks decide
  // acceptance, and targets are never increased to fit an excessive detour.
  const errors=physical(c),length=ddrRouteLength(t.route)
  accepted=!errors.length&&g350PlanningTimingFits(c,t,solved,goal)
  attempts.push({name,layers,accepted,lengthMm:length,targetMm:goal,physicalErrors:errors.length})
  if(accepted){circuit=c;solved.push({name,lengthMm:length,targetMm:goal});break}
 }
 fs.writeFileSync(`${root}/candidate.circuit.json`,JSON.stringify(circuit,null,2)+'\n');fs.writeFileSync(`${root}/attempts.json`,JSON.stringify(attempts,null,2)+'\n');fs.writeFileSync(`${root}/solved.json`,JSON.stringify(solved,null,2)+'\n')
 console.log(JSON.stringify({name,accepted,timedSignals:solved.length,required:49}))
}
fs.writeFileSync(`${root}/physical-errors.json`,JSON.stringify(physical(circuit),null,2)+'\n')
console.log(JSON.stringify({timedSignals:solved.length,required:49,fabricationReady:false}))
