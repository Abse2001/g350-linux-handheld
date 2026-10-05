import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const input='dist/experiments/am3352-g350-pin-allocation/circuit.json'
const d=JSON.parse(readFileSync(input)),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const src=new Map(d.filter(e=>e.type==='source_component').map(e=>[e.source_component_id,e]))
const comps=new Map(d.filter(e=>e.type==='pcb_component').map(e=>[src.get(e.source_component_id).name,e]))
const names=new Map([...comps].map(([name,p])=>[p.pcb_component_id,name]))
const pp=new Map(d.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,e]))
const sp=new Map(d.filter(e=>e.type==='source_port').map(e=>[e.source_port_id,e]))
const box=q=>q.outline?{minX:Math.min(...q.outline.map(p=>p.x)),maxX:Math.max(...q.outline.map(p=>p.x)),
 minY:Math.min(...q.outline.map(p=>p.y)),maxY:Math.max(...q.outline.map(p=>p.y))}:
 {minX:q.center.x-(q.width??2*q.radius)/2,maxX:q.center.x+(q.width??2*q.radius)/2,
 minY:q.center.y-(q.height??2*q.radius)/2,maxY:q.center.y+(q.height??2*q.radius)/2}
const courts=new Map(d.filter(e=>e.type.startsWith('pcb_courtyard_')).map(e=>[names.get(e.pcb_component_id),{...box(e),layer:e.layer}]))
assert.equal(courts.size,280)
const ramNames=[...comps.keys()].filter(n=>/^(U_RAM|C_DDR_RAM_[0-9]+|C_DDR_RAM_BULK[12]|C_VREF_RAM_(?:CA|DQ)|R_DDR_ZQ)$/.test(n))
assert.equal(ramNames.length,18)
const moves=Object.fromEntries(ramNames.map(name=>{
 const c=comps.get(name)
 return [name,{x:c.center.x,y:+(c.center.y+7).toFixed(8),layer:c.layer,rotation:c.rotation}]
}))
assert.deepEqual(moves.U_RAM,{x:0,y:0,layer:'top',rotation:0})

// Engineering reservation for the forthcoming DDR routes and reference planes.
// Actual routed keepout and full TI return-path compliance must be checked
// against copper, including CPU breakout boundaries; this box is no signoff.
const reservation={minX:-14.5,maxX:8.5,minY:-8.5,maxY:19.3}
const nonDdrClearanceMm=4*.1016
// Independently transcribed SPRS717L ZCZ balls; no signal-name fuzzy matching.
const balls=['R1','R2','R3','R4','T1','T2','T3','T4','U1','U2','U3','U4','V2','V3','V4','T5',
 'U13','V13','R12','T12','U12','T11','T10','U10']
const signals=[...balls.map((ball,i)=>({name:`R_LCD_DATA${i}`,ball})),
 {name:'R_LCD_HSYNC',ball:'R5'},{name:'R_LCD_VSYNC',ball:'U5'},
 {name:'R_LCD_PCLK',ball:'V5'},{name:'R_LCD_DE',ball:'R6'}]
const movable=new Set(signals.map(s=>s.name))
const overlap=(a,b)=>a.layer===b.layer&&a.minX<b.maxX+.02&&a.maxX>b.minX-.02&&a.minY<b.maxY+.02&&a.maxY>b.minY-.02
const fixed=[...courts].filter(([name])=>!movable.has(name)).map(([name,b])=>{
 const offset=ramNames.includes(name)?7:0
 return {...b,minY:b.minY+offset,maxY:b.maxY+offset,name}
})
for(const name of ramNames){
 const own=fixed.find(f=>f.name===name)
 assert(!fixed.some(f=>f.name!==name&&overlap(own,f)),'RAM group translation collides with '+name)
 assert(own.minX>=reservation.minX&&own.maxX<=reservation.maxX&&own.minY>=reservation.minY&&own.maxY<=reservation.maxY,'Translated RAM group outside reservation '+name)
}
const cpuPorts=d.filter(e=>e.type==='pcb_port'&&e.pcb_component_id===comps.get('U_SOC').pcb_component_id)
const parts=signals.map(s=>{
 const target=cpuPorts.filter(p=>sp.get(p.source_port_id)?.port_hints.includes(s.ball))
 assert.equal(target.length,1)
 const c=comps.get(s.name),court=courts.get(s.name)
 assert.equal(c.layer,'bottom');assert.equal(c.rotation,90)
 const p1=d.filter(p=>p.type==='pcb_smtpad'&&p.pcb_component_id===c.pcb_component_id&&sp.get(pp.get(p.pcb_port_id)?.source_port_id)?.pin_number===1)
 assert.equal(p1.length,1)
 // Native bottom-side90 ->180 rotates these world offsets90deg CCW.
 const dx=p1[0].x-c.center.x,dy=p1[0].y-c.center.y
 const delta={x:-dy,y:dx}
 const w=court.maxY-court.minY+.08,h=court.maxX-court.minX+.08
 const oldDistance=Math.hypot(p1[0].x-target[0].x,p1[0].y-target[0].y)
 return {...s,c,target:target[0],delta,w,h,oldDistance}
})
const slots=[]
// The exact imported courts, including conservative inflation, need
// 2.46 x 1.58 mm. Use disjoint slots, clear of the CPU bypass bank.
for(const x of [10.7,13.3,15.9])for(let j=0;j<17;j++)slots.push({x,y:+(7.6+j*1.65).toFixed(4),layer:'bottom',rotation:180})
for(const p of parts){
 p.candidates=slots.flatMap((slot,slotId)=>{
  const b={...slot,minX:slot.x-p.w/2,maxX:slot.x+p.w/2,minY:slot.y-p.h/2,maxY:slot.y+p.h/2}
  if(b.minX<reservation.maxX+nonDdrClearanceMm||fixed.some(f=>overlap(b,f)))return []
  const distance=Math.hypot(slot.x+p.delta.x-p.target.x,slot.y+p.delta.y-p.target.y)
  if(distance>11)return [] // engineering search bound, not a TI LCD limit
  return [{...b,slotId,distance,cost:distance+.01*Math.abs(slot.y-p.target.y)}]
 })
 assert(p.candidates.length,'No collision-free LCD source position '+p.name)
}
// Exact min-cost matching on disjoint courtyard slots, with residual edges.
const start=parts.length+slots.length,end=start+1,graph=Array.from({length:end+1},()=>[])
const edge=(a,b,cost,slotId)=>{
 const x={to:b,cost,capacity:1,reverse:graph[b].length,slotId},y={to:a,cost:-cost,capacity:0,reverse:graph[a].length}
 graph[a].push(x);graph[b].push(y)
}
parts.forEach((p,i)=>{edge(start,i,0);p.candidates.forEach(c=>edge(i,parts.length+c.slotId,Math.round(c.cost*1e6),c.slotId))})
slots.forEach((_,i)=>edge(parts.length+i,end,0))
let flow=0
while(flow<parts.length){
 const dist=Array(graph.length).fill(Infinity),prev=Array(graph.length),queue=[start],queued=new Set(queue)
 dist[start]=0
 while(queue.length){
  const a=queue.shift();queued.delete(a)
  graph[a].forEach((e,i)=>{
   if(e.capacity&&dist[a]+e.cost<dist[e.to]){
    dist[e.to]=dist[a]+e.cost;prev[e.to]=[a,i]
    if(!queued.has(e.to)){queue.push(e.to);queued.add(e.to)}
   }
  })
 }
 if(!prev[end])break
 for(let at=end;at!==start;){const [a,i]=prev[at],e=graph[a][i];e.capacity--;graph[at][e.reverse].capacity++;at=a}
 flow++
}
const solution=flow===parts.length?parts.map((p,i)=>{
 const used=graph[i].find(e=>e.slotId!==undefined&&e.capacity===0);assert(used)
 return {name:p.name,ball:p.ball,...p.candidates.find(c=>c.slotId===used.slotId),oldSourcePadDistanceMm:p.oldDistance}
}):null
if(solution){
 for(let i=0;i<solution.length;i++)for(let j=i+1;j<solution.length;j++)assert(!overlap(solution[i],solution[j]),`Assigned LCD courts overlap: ${solution[i].name}, ${solution[j].name}`)
 for(const p of solution)moves[p.name]={x:p.x,y:p.y,rotation:p.rotation,layer:p.layer}
}
const root='checks/layout/ddr-corridor-variant'
mkdirSync(root,{recursive:true})
const report={status:solution?'PLANNED_REQUIRES_NATIVE_BUILD_AND_DRC':'NO_COMPLETE_ASSIGNMENT',fabricationReady:false,
 routingPermitted:false,algorithm:'min-cost disjoint-slot assignment',input,inputSha256:sha(input),plannerSha256:sha('scripts/plan-g350-ddr-corridor-placement.mjs'),
 sourceResistors:28,assigned:flow,ramGroupTranslatedMm:7,ramGroupParts:ramNames,cpuToRamCenterDistanceMm:20,
 reservation,nonDdrClearanceMm,conservativeCourtyardInflationEachSideMm:.04,
 sourcePadDistances:solution?.map(p=>({name:p.name,ball:p.ball,oldDistanceMm:p.oldSourcePadDistanceMm,newDistanceMm:p.distance})),
 scope:'Geometric placement assistance. Reservation is an engineering routing plan; copper routing, exact TI keepout, reference returns, signal integrity, shell fit and manufacturing remain unverified.'}
writeFileSync(`${root}/ddr-corridor-plan.json`,JSON.stringify(report,null,2)+'\n')
assert(solution,'No complete LCD assignment; source placement table not written')
writeFileSync('lib/am3352/placement/ddr-corridor-placements.json',JSON.stringify(moves,null,2)+'\n')
console.log(JSON.stringify({status:report.status,moved:46,ramGroupParts:18,lcdResistors:28,
 maxSourcePadDistanceMm:Math.max(...solution.map(p=>p.distance)),
 oldAverageDistanceMm:parts.reduce((s,p)=>s+p.oldDistance,0)/28,
 newAverageDistanceMm:solution.reduce((s,p)=>s+p.distance,0)/28,cpuToRamDistanceMm:20},null,2))
