// Real planar reroute between two existing full-depth barrels. No new holes.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {routeGuardedOuterBridge} from './lib/g350-ddr-timing-detour-bridge.mjs'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,root,name='DDR_D9',layer='bottom']=process.argv.slice(2);assert(input&&root&&!fs.existsSync(root)&&['top','bottom','inner1','inner2'].includes(layer));fs.mkdirSync(root)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),original=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const source=original.find(e=>e.type==='source_trace'&&e.name===name);assert(source)
const trace=original.find(e=>e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id);assert(trace)
const rebuildFromPads=process.env.G350_SPAN_REBUILD_FROM_PADS==='1'
const direct=process.env.G350_SPAN_DIRECT_PADS==='1'||rebuildFromPads
const removeIntermediate=process.env.G350_SPAN_REMOVE_INTERMEDIATE==='1'
const allowNewVias=process.env.G350_SPAN_ALLOW_NEW_VIAS==='1'
assert(!allowNewVias||removeIntermediate,'New barrels require explicit middle-channel reconstruction')
assert(!(direct&&removeIntermediate)||rebuildFromPads,'Choose one physical via-removal scope')
assert(!rebuildFromPads||allowNewVias&&removeIntermediate,'Full pad reconstruction requires explicit real barrel replacement')
assert(!direct||layer==='top','Direct BGA-pad diagnostic starts on the authored top side')
const maxNewVias=process.env.G350_SPAN_MAX_NEW_VIAS===undefined?2:Number(process.env.G350_SPAN_MAX_NEW_VIAS)
assert(Number.isInteger(maxNewVias)&&maxNewVias>=2&&maxNewVias<=8)
const viaCostMm=Number(process.env.G350_SPAN_VIA_COST_MM??2),heuristicWeight=Number(process.env.G350_SPAN_HEURISTIC_WEIGHT??1.5),searchSeconds=Number(process.env.G350_SPAN_SEARCH_SECONDS??15)
const gridMm=Number(process.env.G350_SPAN_GRID_MM??.025);assert([.02,.025,.04].includes(gridMm))
assert(Number.isFinite(searchSeconds)&&searchSeconds>0&&searchSeconds<=60)
const indexes=trace.route.flatMap((p,i)=>p.route_type==='via'?[i]:[]);assert(indexes.length>=2)
const viaRange=process.env.G350_SPAN_VIA_RANGE?.split(',').map(Number)??[0,indexes.length-1]
assert(viaRange.length===2&&viaRange.every(n=>Number.isInteger(n)&&n>=0&&n<indexes.length)&&viaRange[0]<viaRange[1]);assert(!direct||!process.env.G350_SPAN_VIA_RANGE)
if(!removeIntermediate&&!process.env.G350_SPAN_VIA_RANGE)assert.equal(indexes.length,2,'Original mode replans a complete two-barrel channel')
const startIndex=indexes[viaRange[0]],endIndex=indexes[viaRange[1]],[start,end]=direct?[trace.route[0],trace.route.at(-1)]:[trace.route[startIndex],trace.route[endIndex]];if(!direct)assert(start.from_layer!==layer&&end.to_layer!==layer,'Both barrels must remain genuine layer transitions')
const removedPoints=direct?indexes.map(i=>trace.route[i]):removeIntermediate?indexes.slice(viaRange[0]+1,viaRange[1]).map(i=>trace.route[i]):[]
const removedViaIds=new Set(original.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===trace.pcb_trace_id&&removedPoints.some(p=>Math.hypot(p.x-e.x,p.y-e.y)<1e-8)).map(e=>e.pcb_via_id))
assert.equal(removedViaIds.size,removedPoints.length)
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of original.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const own=find(source.source_trace_id),owners=new Map(original.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,find(e.source_trace_id)])),ports=new Map(original.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,e.source_port_id]))
const routingLayers=allowNewVias?['top','inner1','inner2','bottom']:[layer,...['top','bottom','inner1','inner2'].filter(l=>l!==layer).slice(0,1)],shapes=[]
for(const p of original.filter(e=>e.type==='pcb_smtpad'&&Number.isFinite(e.x))){const w=p.width??2*p.radius,h=p.height??w;if(Number.isFinite(w)&&Number.isFinite(h))shapes.push({kind:p.shape==='circle'?'circle':'rect',x:p.x,y:p.y,w,h,layers:[p.layer].filter(l=>routingLayers.includes(l)),pad:true,owner:find(ports.get(p.pcb_port_id)??p.pcb_smtpad_id)})}
for(const v of original.filter(e=>e.type==='pcb_via'&&!removedViaIds.has(e.pcb_via_id)))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers:routingLayers,owner:owners.get(v.pcb_trace_id)})
for(const t of original.filter(e=>e.type==='pcb_trace'))for(let i=1;i<t.route.length;i++){const a=t.route[i-1],b=t.route[i];if(a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:b.width??.1016,layers:[a.layer].filter(l=>routingLayers.includes(l)),owner:find(t.source_trace_id)})}
// Computational via prohibition: only wires are searched. This reserve has
// no copper representation and cannot qualify a physical board.
if(!allowNewVias)shapes.push({kind:'rect',x:0,y:12,w:100,h:100,layers:routingLayers,viaOnly:true,owner:'NO_NEW_HOLES'})
const bounds=process.env.G350_SPAN_BOUNDS_JSON?JSON.parse(process.env.G350_SPAN_BOUNDS_JSON):{minX:-16,maxX:16,minY:-6,maxY:30},cases=process.env.G350_SPAN_WAYPOINTS_JSON?JSON.parse(process.env.G350_SPAN_WAYPOINTS_JSON):process.env.G350_SPAN_DIRECT_ONLY==='1'?[[]]:[[],[{x:-12,y:26}],[{x:-12,y:24}],[{x:-10,y:24}],[{x:12,y:26}]],attempts=[];let retained=null
assert(Object.keys(bounds).sort().join(',')==='maxX,maxY,minX,minY'&&Object.values(bounds).every(n=>Number.isFinite(n)&&Math.abs(n/.025-Math.round(n/.025))<1e-7))
assert(bounds.maxX>bounds.minX&&bounds.maxY>bounds.minY&&bounds.maxX-bounds.minX<=64&&bounds.maxY-bounds.minY<=64)
const outline=original.find(e=>e.type==='pcb_board').outline
const inside=p=>{let hit=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){const a=outline[i],b=outline[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit}return hit}
const corners=[{x:bounds.minX,y:bounds.minY},{x:bounds.maxX,y:bounds.minY},{x:bounds.maxX,y:bounds.maxY},{x:bounds.minX,y:bounds.maxY}]
const crosses=(a,b,d,e)=>{const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return cross(a,b,d)*cross(a,b,e)<0&&cross(d,e,a)*cross(d,e,b)<0}
assert(corners.every(inside)&&!outline.some((a,i)=>corners.some((d,j)=>crosses(a,outline[(i+1)%outline.length],d,corners[(j+1)%4]))),'Planning bounds must remain inside the unchanged shaped outline')
assert(Array.isArray(cases)&&cases.length&&cases.length<=12&&cases.every(w=>Array.isArray(w)&&w.length<=4&&w.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=bounds.minX&&p.x<=bounds.maxX&&p.y>=bounds.minY&&p.y<=bounds.maxY&&Math.abs(p.x/.025-Math.round(p.x/.025))<1e-7&&Math.abs(p.y/.025-Math.round(p.y/.025))<1e-7&&(!p.layer||routingLayers.includes(p.layer))&&(allowNewVias||!p.layer||p.layer===layer))))
const guardEarlierLegs=process.env.G350_SPAN_GUARD_EARLIER_LEGS==='1'
fs.copyFileSync('scripts/replan-g350-ddr-existing-barrel-span.mjs',root+'/planner.executed.mjs');fs.copyFileSync('scripts/lib/g350-ddr-timing-detour-bridge.mjs',root+'/bridge.executed.mjs')
for(const waypoints of cases){
 const points=[start,...waypoints,end].map(p=>({x:p.x,y:p.y,layer:p.layer??layer})),route=[];const legs=[];let failed=false
 assert(points.every(p=>Math.abs((p.x-bounds.minX)/gridMm-Math.round((p.x-bounds.minX)/gridMm))<1e-7&&Math.abs((p.y-bounds.minY)/gridMm-Math.round((p.y-bounds.minY)/gridMm))<1e-7),'Every real leg terminal must lie exactly on the selected planning grid')
 for(let i=1;i<points.length;i++){
  const legShapes=[...shapes]
  if(guardEarlierLegs&&route.length){
   // Reserve earlier proposed copper as hard geometry. Only the final .35 mm
   // of the immediate junction is open for a legal continuous bend; complete
   // native self-short checks still reject a reversed or bypassed join.
   let distance=0
   for(let k=route.length-1;k>0;k--){let a=route[k-1],b=route[k]
    if(b.route_type==='via'){
     // A real barrel at the immediate leg junction is a legal wire contact.
     // Keep its drill reserved, so the next leg cannot create a second hole.
     const junction=Math.hypot(b.x-route.at(-1).x,b.y-route.at(-1).y)<1e-8
     legShapes.push({kind:'circle',x:b.x,y:b.y,w:.4572,h:.4572,hole:.254,layers:routingLayers,owner:junction?own:'EARLIER_REAL_BARREL'})
    }
    if(a.route_type!=='wire'||b.route_type!=='wire'||a.layer!==b.layer)continue
    const length=Math.hypot(b.x-a.x,b.y-a.y);if(length<1e-9)continue
    if(distance+length>.35){const fraction=Math.max(0,(.35-distance)/length),stop={...b,x:b.x+(a.x-b.x)*fraction,y:b.y+(a.y-b.y)*fraction};legShapes.push({kind:'segment',a,b:stop,w:.1016,layers:[a.layer],owner:'EARLIER_REAL_WIRE'})}
    distance+=length
   }
  }
  const result=routeGuardedOuterBridge({connection:{name:own,pointsToConnect:[points[i-1],points[i]]},shapes:legShapes,searchBounds:bounds,seconds:searchSeconds,gridMm,maxVias:maxNewVias,viaGrid:gridMm,routingLayers,viaCostMm,heuristicWeight,viaCopperClearance:.15,rasterGuardMm:0,guardNonterminalOwnVias:true,primaryTerminalLayer:true,...(allowNewVias&&!direct&&i===1?{startTerminalLayers:routingLayers.filter(l=>l!==start.from_layer)}:{}),...(allowNewVias&&!direct&&i===points.length-1?{goalTerminalLayers:routingLayers.filter(l=>l!==end.to_layer)}:{})})
  legs.push({error:result.error??null,expanded:result.expanded,startBlocked:result.startBlocked,goalBlocked:result.goalBlocked});if(!result.route){failed=true;break}
  if(!allowNewVias){assert.equal(result.newVias,0);assert(result.route.every(p=>p.route_type==='wire'&&p.layer===layer))}
  route.push(...result.route.slice(i===1?0:1))
 }
 const record={waypoints,legs,accepted:false};attempts.push(record)
 if(failed){console.log(JSON.stringify(record));continue}
 const c=structuredClone(original).filter(e=>e.type!=='pcb_via'||!removedViaIds.has(e.pcb_via_id)),t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id)
 if(direct){t.route=route;t.route[0]=structuredClone(trace.route[0]);t.route[t.route.length-1]=structuredClone(trace.route.at(-1))}
 else{const head=structuredClone(trace.route.slice(0,startIndex+1)),tail=structuredClone(trace.route.slice(endIndex));head.at(-1).to_layer=route[0].layer;tail[0].from_layer=route.at(-1).layer;assert(head.at(-1).from_layer!==head.at(-1).to_layer&&tail[0].from_layer!==tail[0].to_layer);t.route=[...head,...route,...tail]}
 const newVias=route.filter(p=>p.route_type==='via').map((v,i)=>({type:'pcb_via',pcb_via_id:'g350_span_'+trace.pcb_trace_id+'_'+i,pcb_trace_id:trace.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:trace.subcircuit_id}))
 c.push(...newVias)
 delete t.trace_length
 const counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkPcbRoutingConstraints','checkTracesAreContiguous','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c).length]));counts.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length
 record.counts=counts;record.nativeLengthMm=ddrRouteLength(t.route)
 if(Object.values(counts).some(n=>n)){fs.writeFileSync(root+'/rejected-'+attempts.length+'.circuit.json',JSON.stringify(c,null,2)+'\n');console.log(JSON.stringify(record));continue}
 const newIds=new Set(newVias.map(v=>v.pcb_via_id))
 const unchanged=j=>j.filter(e=>!(e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id)&&!(e.type==='pcb_via'&&(removedViaIds.has(e.pcb_via_id)||newIds.has(e.pcb_via_id))));assert.deepEqual(unchanged(c),unchanged(original))
 record.newFullDepthVias=newVias.length
 record.accepted=true;const path=root+'/case-'+attempts.length+'.circuit.json';fs.writeFileSync(path,JSON.stringify(c,null,2)+'\n');record.candidate={path,sha256:hash(path)};retained??=path;console.log(JSON.stringify(record))
}
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:hash(input)},name,layer,bounds,gridMm,planningBoundsInsideUnchangedOutline:true,directPads:direct,rebuildFromPads,maxNewVias,viaCostMm,heuristicWeight,searchSeconds,viaRange,removeIntermediate,allowNewVias,guardEarlierLegs,proposedRemovedOwnedViaIds:[...removedViaIds],removedOwnedVias:retained?removedViaIds.size:0,attempts,retained,allForeignHolesAndPeripheralGeometryExactlyPreserved:true,changedBarrelAccessLayers:!direct,requiresFreshGroundSourceAndIndependentChecks:true,planningOnly:true,fabricationReady:false},null,2)+'\n')
