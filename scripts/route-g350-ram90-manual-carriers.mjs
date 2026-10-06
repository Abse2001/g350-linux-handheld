import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {routeGuardedOuterBridge} from './lib/am3352-command-terminal-bridge.mjs'
import * as checks from '@tscircuit/checks'
const [base,root,priorArg,layerOverride,priorityArg]=process.argv.slice(2)
const prior=priorArg==='-'?null:priorArg
assert(base&&root&&!existsSync(root))
const read=p=>JSON.parse(readFileSync(p))
const prep=read(`${base}/preparation.json`);assert.equal(prep.physicalErrors,0)
const circuit=read(`${base}/candidate.circuit.json`),input=read(`${base}/solver-input.json`),connections=read(`${base}/all-ddr-connections.json`)
const names=new Map(circuit.filter(r=>r.type==='source_trace').map(r=>[r.source_trace_id,r.name]))
if(priorityArg){const priority=priorityArg.split(',');connections.sort((a,b)=>{const rank=c=>{const i=priority.indexOf(names.get(c.name));return i<0?100:i};return rank(a)-rank(b)})}
const fixed=input.traces,carriers=prior?read(`${prior}/carriers.json`):[],attempts=[]
for(const t of carriers)circuit.push(t,...t.route.filter(p=>p.route_type==='via').map((v,i)=>({type:'pcb_via',pcb_via_id:`ram90_prior_via_${t.pcb_trace_id}_${i}`,pcb_trace_id:t.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:t.subcircuit_id})))
mkdirSync(root)
writeFileSync(`${root}/route.executed.mjs`,readFileSync('scripts/route-g350-ram90-manual-carriers.mjs'))
writeFileSync(`${root}/guard.executed.mjs`,readFileSync('scripts/lib/am3352-command-terminal-bridge.mjs'))
for(const connection of connections){
 if(carriers.some(t=>t.source_trace_id===connection.name))continue
 const name=names.get(connection.name),layers=layerOverride?layerOverride.split(','):connection.pointsToConnect[0].layer==='bottom'?['top','bottom']:['inner1','inner2']
 const shapes=input.obstacles.map(o=>({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.find(n=>connections.some(c=>c.name===n))}))
 for(const t of [...fixed,...carriers])for(let i=0;i<t.route.length;i++){
  const p=t.route[i],owner=t.connection_name??t.source_trace_id
  if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:.4572,h:.4572,hole:.254,layers,owner})
  const q=t.route[i-1]
  if(q&&p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer&&Math.hypot(p.x-q.x,p.y-q.y)>1e-8)shapes.push({kind:'segment',a:q,b:p,w:.1016,layers:layers.includes(p.layer)?[p.layer]:[],owner})
 }
 const result=routeGuardedOuterBridge({connection,shapes,searchBounds:input.bounds,seconds:10,gridMm:.02,maxVias:4,viaGrid:.04,routingLayers:layers,viaCopperClearance:.15})
 let physicalErrors=[]
 if(result.route){
  const trace={type:'pcb_trace',pcb_trace_id:`ram90_carrier_${name}`,source_trace_id:connection.name,connection_name:connection.name,route:result.route,subcircuit_id:'subcircuit_source_group_0'}
  const vias=trace.route.filter(p=>p.route_type==='via').map((v,i)=>({type:'pcb_via',pcb_via_id:`ram90_carrier_via_${name}_${i}`,pcb_trace_id:trace.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:trace.subcircuit_id}))
  const candidate=[...circuit,trace,...vias]
  physicalErrors=prep.physicalChecks.flatMap(check=>checks[check](candidate).map(e=>({check,...e})))
  if(!physicalErrors.length){carriers.push(trace);circuit.push(trace,...vias)}
 }
 attempts.push({name,found:!!result.route,accepted:!!result.route&&!physicalErrors.length,error:result.error??null,expanded:result.expanded,startBlocked:result.startBlocked,goalBlocked:result.goalBlocked,physicalErrors})
 writeFileSync(`${root}/carriers.json`,JSON.stringify(carriers,null,2)+'\n')
 writeFileSync(`${root}/attempts.json`,JSON.stringify(attempts,null,2)+'\n')
 console.log(JSON.stringify({name,accepted:attempts.at(-1).accepted,carriers:carriers.length,error:result.error,physicalErrors:physicalErrors.length}))
}
writeFileSync(`${root}/candidate.circuit.json`,JSON.stringify(circuit,null,2)+'\n')
writeFileSync(`${root}/result.json`,JSON.stringify({plannedCarriers:carriers.length,required:49,qualifiedNewSignals:0,sourceReplayRequired:true,timingQualified:false,fabricationReady:false},null,2)+'\n')
