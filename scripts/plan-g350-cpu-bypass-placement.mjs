import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Placement assistance only. Distances are geometric lower bounds, not
// routed loop inductance or a replacement for TI's copper/PDN requirements.
const input='dist/experiments/am3352-g350-harness-placement/circuit.json'
const d=JSON.parse(readFileSync(input)),map=JSON.parse(readFileSync('lib/am3352/cpu-ball-map.json')).pins
const source=new Map(d.filter(e=>e.type==='source_component').map(e=>[e.source_component_id,e]))
const comps=new Map(d.filter(e=>e.type==='pcb_component').map(e=>[source.get(e.source_component_id).name,e]))
const names=new Map([...comps].map(([n,c])=>[c.pcb_component_id,n]))
const pp=new Map(d.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,e]))
const sp=new Map(d.filter(e=>e.type==='source_port').map(e=>[e.source_port_id,e]))
const cpu=comps.get('U_SOC')
const pins=d.filter(e=>e.type==='pcb_smtpad'&&e.pcb_component_id===cpu.pcb_component_id).map(p=>{
 const port=sp.get(pp.get(p.pcb_port_id).source_port_id),ball=port.port_hints.find(h=>map[h])
 return {...p,ball,fn:map[ball]}
})
const bankFunctions={CORE:'VDD_CORE',MPU:'VDD_MPU',VDDS:'VDDS',SRAM_CORE:'VDDS_SRAM_CORE_BG',SRAM_MPU:'VDDS_SRAM_MPU_BB',
 ...Object.fromEntries(Array.from({length:6},(_,i)=>['HV'+(i+1),'VDDSHV'+(i+1)]))}
const bound=points=>({minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))})
const courts=new Map(d.filter(e=>e.type==='pcb_courtyard_outline').map(e=>[names.get(e.pcb_component_id),{...bound(e.outline),layer:e.layer}]))
const parts=[]
for(const [name,c] of comps){
 const key=Object.keys(bankFunctions).sort((a,b)=>b.length-a.length).find(k=>new RegExp('^C_'+k+'_(?:BULK|[0-9]+)$').test(name))
 const fn=key?bankFunctions[key]:name.startsWith('C_CAP_')||/^C_VDD(?:S_|A[13]P[83]V_USB)/.test(name)?name.slice(2):null
 if(!fn)continue
 const targets=pins.filter(p=>p.fn===fn);assert(targets.length)
 const box=courts.get(name);assert(box)
 // The imports have up to 0.013mm asymmetric courtyard centering.
 // Inflate each side by 0.04mm to contain either rotated/mirrored version.
 const w=box.maxX-box.minX+.08,h=box.maxY-box.minY+.08
 const oldDistance=Math.min(...targets.map(p=>Math.hypot(p.x-c.center.x,p.y-c.center.y)))
 parts.push({name,c,fn,targets,w,h,oldDistance,bulk:name.endsWith('_BULK'),output:name.startsWith('C_CAP_')})
}
assert.equal(parts.length,59)
const movable=new Set(parts.map(p=>p.name))
const fixed=[...courts].filter(([n])=>!movable.has(n)).map(([name,b])=>({...b,name}))
const overlap=(a,b)=>a.layer===b.layer&&a.minX<b.maxX+.02&&a.maxX>b.minX-.02&&a.minY<b.maxY+.02&&a.maxY>b.minY-.02
const candidate=(p,x,y,rotation,layer)=>{
 const swap=rotation===90,w=swap?p.h:p.w,h=swap?p.w:p.h
 const b={minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,layer}
 if(fixed.some(f=>overlap(b,f)))return null
 if(layer==='bottom'&&!p.bulk&&(b.minY<19.3||b.maxY>33||b.minX< -10||b.maxX>11))return null
 if(layer==='bottom'&&p.bulk&&(b.minY<33.5||b.maxY>41||b.minX< -17.5||b.maxX>17.5))return null
 if(layer==='top'&&(b.minY<17.5||b.maxY>41||b.minX< -17.5||b.maxX>17.5))return null
 const distances=p.targets.map(t=>({...t,distance:Math.hypot(t.x-x,t.y-y)})).sort((a,b)=>a.distance-b.distance)
 const distance=distances[0].distance
 // Engineering search bounds, not manufacturer limits. Bulk's qualitative
 // "near" requirement and all real copper paths remain review gates.
 const limit=p.bulk?15:p.output?4:p.fn.startsWith('VDDSHV')||['VDD_CORE','VDD_MPU','VDDS'].includes(p.fn)?7:5.5
 if(distance>limit)return null
 return {x,y,rotation,layer,...b,distance,targetBall:distances[0].ball,
  cost:distance+(p.bulk?.5:0)*Math.abs(y-29)+.015*Math.hypot(x-p.c.center.x,y-p.c.center.y)}
}
const slots=[]
for(let ix=0;ix<8;ix++)for(let iy=0;iy<7;iy++)slots.push({x:+(-8.5+ix*2.4).toFixed(4),y:+(20.1+iy*1.65).toFixed(4),layer:'bottom',bulk:false})
for(const y of [32,35.1])for(const x of [-11,-5,1,7,13])slots.push({x,y,layer:'top',bulk:true})
for(const y of [20.5,24,27.5])slots.push({x:-11,y,layer:'top',bulk:true})
for(const y of [35.2,38.4])for(const x of [-11,-5,1,7,13])slots.push({x,y,layer:'bottom',bulk:true})
for(const p of parts){
 p.candidates=slots.flatMap((s,slotId)=>{
  if(s.bulk!==p.bulk)return []
  const c=candidate(p,s.x,s.y,0,s.layer)
  return c?[{...c,slotId}]:[]
 })
 assert(p.candidates.length,`No candidates: ${p.name}`)
}
// Exact minimum-cost bipartite assignment on disjoint courtyard slots.
// Reverse residual edges let constrained parts displace earlier choices.
const start=parts.length+slots.length,end=start+1,graph=Array.from({length:end+1},()=>[])
const edge=(a,b,cost,slotId)=>{
 const x={to:b,cost,capacity:1,reverse:graph[b].length,slotId}
 const y={to:a,cost:-cost,capacity:0,reverse:graph[a].length}
 graph[a].push(x);graph[b].push(y)
}
parts.forEach((p,i)=>{edge(start,i,0);p.candidates.forEach(c=>edge(i,parts.length+c.slotId,Math.round(c.cost*1e6),c.slotId))})
slots.forEach((s,i)=>edge(parts.length+i,end,0))
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
const solution=flow===parts.length?Object.fromEntries(parts.map((p,i)=>{
 const used=graph[i].find(e=>e.slotId!==undefined&&e.capacity===0);assert(used)
 return [p.name,p.candidates.find(c=>c.slotId===used.slotId)]
})):null
if(solution){const a=Object.values(solution);for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)assert(!overlap(a[i],a[j]),'Assigned slots overlap')}
mkdirSync('checks/layout/critical-variant',{recursive:true})
const report={status:solution?'PLANNED_REQUIRES_NATIVE_BUILD_AND_DRC':'NO_COMPLETE_ASSIGNMENT',algorithm:'minimum-cost disjoint-slot assignment',assigned:flow,parts:parts.length,
 input,inputSha256:createHash('sha256').update(readFileSync(input)).digest('hex'),
 manufacturer:'SPRS717L sections 5.9 and 7.7.2.3.3.7. General proximity search bounds are engineering choices, not TI limits.',
 unchangedDdrComponents:true,reservedBottomCourtyardMinY:19.3,conservativeCourtyardExtraMarginMm:.04,routingPermitted:false,
 plannerSha256:createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
 measurements:parts.map(p=>({name:p.name,function:p.fn,oldNearestSupplyDistanceMm:p.oldDistance,
  newNearestSupplyDistanceMm:solution?.[p.name]?.distance,targetBall:solution?.[p.name]?.targetBall,
  candidateCount:p.candidates.length})),fabricationReady:false}
writeFileSync('checks/layout/critical-variant/cpu-bypass-plan.json',JSON.stringify(report,null,2)+'\n')
if(!solution){console.log(JSON.stringify({...report,measurements:report.measurements.map(x=>({name:x.name,candidateCount:x.candidateCount}))},null,2));process.exit(1)}
const moves=Object.fromEntries(Object.entries(solution).map(([n,c])=>[n,{x:c.x,y:c.y,layer:c.layer,rotation:c.rotation}]))
writeFileSync('lib/am3352/placement/cpu-bypass-placements.json',JSON.stringify(moves,null,2)+'\n')
console.log(JSON.stringify({status:report.status,assigned:flow,parts:parts.length,bulk:parts.filter(p=>p.bulk).length,
 maxSmallDistanceMm:Math.max(...parts.filter(p=>!p.bulk).map(p=>solution[p.name].distance)),
 maxBulkDistanceMm:Math.max(...parts.filter(p=>p.bulk).map(p=>solution[p.name].distance))},null,2))
