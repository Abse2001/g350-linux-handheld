import {readFileSync,writeFileSync} from "node:fs"
import {createHash} from "node:crypto"
import assert from "node:assert/strict"

const circuitPath="dist/experiments/am3352-g350-placement-study/circuit.json"
const baselinePath="dist/diagnostics/am3352-command-fine-782-replay-candidate/circuit.json"
const read=p=>JSON.parse(readFileSync(p))
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const d=read(circuitPath),old=read(baselinePath),outline=read("mechanical/g350-provisional-outline.json")
const typeCache=new WeakMap(),idCache=new WeakMap()
const byType=(a,t)=>{
  if(!typeCache.has(a))typeCache.set(a,new Map())
  const m=typeCache.get(a)
  if(!m.has(t))m.set(t,a.filter(x=>x.type===t))
  return m.get(t)
}
const getElement=(a,t,id)=>{
  if(!idCache.has(a))idCache.set(a,new Map())
  const m=idCache.get(a)
  if(!m.has(t))m.set(t,new Map(byType(a,t).map(x=>[x[`${t}_id`],x])))
  return m.get(t).get(id)
}
const board=byType(d,"pcb_board")[0]
assert.equal(byType(d,"pcb_board").length,1)
assert.equal(board.width,76);assert.equal(board.height,118);assert.equal(board.num_layers,4)
assert.deepEqual(board.outline,outline.outline)
for(const type of ["pcb_trace","pcb_via","pcb_copper_pour"])assert.equal(byType(d,type).length,0,`Layout must have no stale ${type}`)
assert.equal(d.filter(x=>x.type.endsWith('_error')).length,0)

const source=byType(d,"source_component"),sourceOld=byType(old,"source_component")
assert.equal(source.length,233);assert.equal(sourceOld.length,212)
assert.equal(new Set(source.map(x=>x.name)).size,source.length)
const componentName=(a,id)=>getElement(a,"source_component",id)?.name
const portKey=(a,p)=>`${componentName(a,p.source_component_id)}:${p.pin_number??p.name}`
const netProjection=a=>{
  const groups=new Map()
  for(const p of byType(a,"source_port")){
    if(!sourceOld.some(s=>s.name===componentName(a,p.source_component_id)))continue
    const key=p.subcircuit_connectivity_map_key??`ISOLATED:${portKey(a,p)}`
    if(!groups.has(key))groups.set(key,[])
    groups.get(key).push(portKey(a,p))
  }
  return [...groups.values()].map(v=>v.sort()).filter(v=>v.length>1).map(v=>v.join('|')).sort()
}
assert.deepEqual(netProjection(d),netProjection(old),"All original host terminal connectivity must be preserved")

const physicalPads=(a,name)=>{
  const s=byType(a,"source_component").find(x=>x.name===name)
  const c=byType(a,"pcb_component").find(x=>x.source_component_id===s.source_component_id)
  return a.filter(p=>["pcb_smtpad","pcb_plated_hole"].includes(p.type)&&p.pcb_component_id===c.pcb_component_id).map(p=>{
    const port=getElement(a,'pcb_port',p.pcb_port_id)
    const sp=getElement(a,'source_port',port?.source_port_id)
    // Rotation and assembly side can change; copper size and pin identity cannot.
    const dims=p.shape==='polygon'?[Math.max(...p.points.map(v=>v.x))-Math.min(...p.points.map(v=>v.x)),Math.max(...p.points.map(v=>v.y))-Math.min(...p.points.map(v=>v.y))]:
      [p.width??p.outer_width??2*(p.radius??p.outer_diameter/2),p.height??p.outer_height??2*(p.radius??p.outer_diameter/2)]
    return JSON.stringify({type:p.type,pin:sp?.pin_number??sp?.name,hints:[...(p.port_hints??[])].sort(),shape:p.shape,size:dims.sort((a,b)=>a-b).map(n=>+n.toFixed(5)),hole:p.hole_diameter??[p.hole_width,p.hole_height]})
  }).sort()
}
for(const s of sourceOld){
  const next=source.find(x=>x.name===s.name)
  assert(next,`Missing original host part ${s.name}`)
  for(const key of ['manufacturer_part_number','supplier_part_numbers','ftype'])assert.deepEqual(next[key],s[key],`${s.name} changed ${key}`)
  assert.deepEqual(physicalPads(d,s.name),physicalPads(old,s.name),`${s.name} changed physical pad size/pin identity`)
}

const poly=board.outline
const segDistance=(p,a,b)=>{
  const dx=b.x-a.x,dy=b.y-a.y
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)))
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)
}
const inside=p=>{
  let yes=false
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j]
    if(((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x))yes=!yes
  }
  return yes
}
const pointClearance=p=>Math.min(...poly.map((a,i)=>segDistance(p,a,poly[(i+1)%poly.length])))*(inside(p)?1:-1)
const rotate=(p,c,deg)=>{
  const r=deg*Math.PI/180
  return {x:c.x+p.x*Math.cos(r)-p.y*Math.sin(r),y:c.y+p.x*Math.sin(r)+p.y*Math.cos(r)}
}
const padEnvelope=p=>{
  if(p.shape==='circle')return {center:{x:p.x,y:p.y},radius:p.radius??p.outer_diameter/2}
  if(p.shape==='polygon')return {points:p.points}
  const w=p.width??p.outer_width,h=p.height??p.outer_height
  assert(Number.isFinite(w)&&Number.isFinite(h),`Unknown pad envelope ${p.shape}`)
  return {points:[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>rotate({x,y},p,p.ccw_rotation??0))}
}
// Sample each complete conservative envelope edge at <=0.1 mm. The distance
// function is 1-Lipschitz, so subtract half that step as a strict lower bound.
const envelopeClearance=e=>{
  if(e.center)return pointClearance(e.center)-e.radius
  let result=Infinity
  for(let i=0;i<e.points.length;i++){
    const a=e.points[i],b=e.points[(i+1)%e.points.length]
    const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/.1))
    for(let j=0;j<=n;j++)result=Math.min(result,pointClearance({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n}))
  }
  return result-.05
}
const copper=d.filter(x=>["pcb_smtpad","pcb_plated_hole"].includes(x.type)).map(p=>{
  const c=byType(d,"pcb_component").find(x=>x.pcb_component_id===p.pcb_component_id)
  return {name:componentName(d,c.source_component_id),pad:p.pcb_smtpad_id??p.pcb_plated_hole_id,clearanceLowerBoundMm:envelopeClearance(padEnvelope(p))}
}).sort((a,b)=>a.clearanceLowerBoundMm-b.clearanceLowerBoundMm)
assert(copper[0].clearanceLowerBoundMm>=board.min_board_edge_clearance,`Copper edge clearance failed: ${JSON.stringify(copper[0])}`)
const courts=byType(d,'pcb_courtyard_outline').map(c=>{
  const pc=byType(d,'pcb_component').find(x=>x.pcb_component_id===c.pcb_component_id)
  return {name:componentName(d,pc.source_component_id),clearanceLowerBoundMm:envelopeClearance({points:c.outline})}
})
const sd=byType(d,'pcb_keepout')
assert.equal(sd.length,2)
assert(sd.every(k=>k.layers.length===1&&k.layers[0]==='top'&&!k.allow_traces&&!k.warning_only))
const cpu=byType(d,'pcb_component').find(x=>componentName(d,x.source_component_id)==='U_SOC')
const ram=byType(d,'pcb_component').find(x=>componentName(d,x.source_component_id)==='U_RAM')
assert.deepEqual(cpu.center,{x:0,y:20});assert.deepEqual(ram.center,{x:0,y:-7})
const sdComponent=byType(d,'pcb_component').find(x=>componentName(d,x.source_component_id)==='J_SD')
assert.deepEqual(sdComponent.center,{x:29.5,y:-33})
const report={status:'PASS_PLACEMENT_ONLY',fabricationReady:false,verifiedOriginalShellFit:false,
  dimensionsMm:{width:76,height:118,mainBodyHeight:99,speakerTongueWidth:22,thickness:board.thickness},
  numCopperLayers:4,logicalComponents:233,preservedHostComponents:212,newControlsAndAudioComponents:21,
  nativeErrors:0,placedPadsAndPlatedHoles:copper.length,minCopperEdgeClearanceLowerBoundMm:copper[0].clearanceLowerBoundMm,
  closestPads:copper.slice(0,5),courtyardOutsideOutline:courts.filter(c=>c.clearanceLowerBoundMm<0),
  staleTraces:0,staleVias:0,originalHostTerminalConnectivityPreserved:true,hostPhysicalPadIdentityPreserved:true,
  scope:'Placement of existing host plus controls/audio. Missing final display/FPC/backlight and harness selection; no routing, DDR timing, shell-fit or fabrication qualification.',
  hashes:Object.fromEntries([circuitPath,baselinePath,'mechanical/g350-provisional-outline.json','lib/am3352/placement/host-placements.json','lib/am3352/placement/LayoutOnly.tsx','lib/am3352/placement/ControlsAndAudio.tsx','experiments/am3352-g350-placement-study.circuit.tsx'].map(p=>[p,sha(p)]))}
writeFileSync('checks/layout/g350-placement-audit.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report,null,2))
