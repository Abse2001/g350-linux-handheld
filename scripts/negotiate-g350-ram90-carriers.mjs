import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {routeGuardedOuterBridge} from './lib/am3352-command-terminal-bridge.mjs'
import * as checks from '@tscircuit/checks'
const [base,root,priorArg]=process.argv.slice(2)
const layerOverride=null,priorityArg=null
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
writeFileSync(`${root}/route.executed.mjs`,readFileSync('scripts/negotiate-g350-ram90-carriers.mjs'))
writeFileSync(`${root}/guard.executed.mjs`,readFileSync('scripts/lib/am3352-command-terminal-bridge.mjs'))
const moves=new Map()
for(let round=0;round<100&&carriers.length<49;round++){
 const missing=connections.filter(c=>!carriers.some(t=>t.source_trace_id===c.name))
 const connection=missing[round%missing.length]
 if(carriers.some(t=>t.source_trace_id===connection.name))continue
 const name=names.get(connection.name),layers=[['inner1','inner2'],['top','bottom'],['inner1','bottom'],['inner2','top']][round%4]
 const shapes=input.obstacles.map(o=>({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.find(n=>connections.some(c=>c.name===n))}))
 for(const t of [...fixed,...carriers])for(let i=0;i<t.route.length;i++){
  const p=t.route[i],owner=t.connection_name??t.source_trace_id,soft=carriers.includes(t),softWeight=1+(moves.get(owner)??0)
  if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:.4572,h:.4572,hole:.254,layers,owner,soft,softWeight})
  const q=t.route[i-1]
  if(q&&p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer&&Math.hypot(p.x-q.x,p.y-q.y)>1e-8)shapes.push({kind:'segment',a:q,b:p,w:.1016,layers:layers.includes(p.layer)?[p.layer]:[],owner,soft,softWeight})
 }
 const result=routeGuardedOuterBridge({connection,shapes,searchBounds:input.bounds,seconds:10,gridMm:.02,maxVias:4,viaGrid:.04,routingLayers:layers,viaCopperClearance:.15})
 let physicalErrors=[]
 if(result.route){
  const trace={type:'pcb_trace',pcb_trace_id:`ram90_carrier_${name}`,source_trace_id:connection.name,connection_name:connection.name,route:result.route,subcircuit_id:'subcircuit_source_group_0'}
  const vias=trace.route.filter(p=>p.route_type==='via').map((v,i)=>({type:'pcb_via',pcb_via_id:`ram90_carrier_via_${name}_${i}`,pcb_trace_id:trace.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:trace.subcircuit_id}))
  let candidate=[...circuit,trace,...vias]
  physicalErrors=prep.physicalChecks.flatMap(check=>checks[check](candidate).map(e=>({check,...e})))
  const removed=[]
  if(physicalErrors.length){
   for(const old of [...carriers])if(physicalErrors.some(e=>JSON.stringify(e).includes(old.pcb_trace_id)||JSON.stringify(e).includes('ram90_carrier_via_'+names.get(old.source_trace_id)+'_')||JSON.stringify(e).includes('ram90_prior_via_'+old.pcb_trace_id+'_'))){removed.push(old);carriers.splice(carriers.indexOf(old),1);moves.set(old.source_trace_id,(moves.get(old.source_trace_id)??0)+1)}
   const rejectedIds=new Set(removed.map(t=>t.pcb_trace_id))
   candidate=candidate.filter(r=>!(r.type==='pcb_trace'&&rejectedIds.has(r.pcb_trace_id))&&!(r.type==='pcb_via'&&rejectedIds.has(r.pcb_trace_id)))
   physicalErrors=prep.physicalChecks.flatMap(check=>checks[check](candidate).map(e=>({check,...e})))
  }
  if(!physicalErrors.length){carriers.push(trace);circuit.splice(0,circuit.length,...candidate);console.log(JSON.stringify({round,rippedUp:removed.map(t=>names.get(t.source_trace_id))}))}
  else {carriers.push(...removed)}
 }
 attempts.push({name,found:!!result.route,accepted:!!result.route&&!physicalErrors.length,error:result.error??null,expanded:result.expanded,startBlocked:result.startBlocked,goalBlocked:result.goalBlocked,physicalErrors})
 writeFileSync(`${root}/carriers.json`,JSON.stringify(carriers,null,2)+'\n')
 writeFileSync(`${root}/attempts.json`,JSON.stringify(attempts,null,2)+'\n')
 console.log(JSON.stringify({name,accepted:attempts.at(-1).accepted,carriers:carriers.length,error:result.error,physicalErrors:physicalErrors.length}))
}
writeFileSync(`${root}/candidate.circuit.json`,JSON.stringify(circuit,null,2)+'\n')
writeFileSync(`${root}/result.json`,JSON.stringify({plannedCarriers:carriers.length,required:49,qualifiedNewSignals:0,sourceReplayRequired:true,timingQualified:false,fabricationReady:false},null,2)+'\n')
