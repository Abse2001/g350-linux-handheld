import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {getSimpleRouteJsonFromCircuitJson} from '@tscircuit/core'
import {selectCheckedCommandSummary,readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {routeSegments,measureRouteExposure,measureSegmentExposure} from './lib/am3352-ddr-spacing-geometry.mjs'

const [sourcePath,directory]=process.argv.slice(2);assert(sourcePath&&directory&&!existsSync(`${directory}/result.json`))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const checked=selectCheckedCommandSummary(artifact(sourcePath)),{summary}=readCheckedCommandSummary(checked),source=read(sourcePath),paths=read(summary.paths.path),name='DDR_D12',logical=source.filter(t=>t.type==='source_trace'),owner=logical.find(s=>s.name===name).source_trace_id,trace=source.find(t=>t.type==='pcb_trace'&&t.source_trace_id===owner),board=source.find(t=>t.type==='pcb_board'),mapping=read(summary.memoryMap.path)
const otherByte=read(summary.planarDdrAudit.path).results.filter(r=>r.name!==name&&/^DDR_D(8|9|1[0-5])$|^DDR_DQM1$|^DDR_DQS[n]?1$/.test(r.name));assert.equal(otherByte.length,10)
const range=[Math.max(...otherByte.map(r=>r.planarLengthMm))-.635+.0001,Math.min(...otherByte.map(r=>r.planarLengthMm))+.635-.0001]
const {simpleRouteJson:input}=getSimpleRouteJsonFromCircuitJson({circuitJson:source,minTraceWidth:.1016,nominalTraceWidth:.1016,minTraceToPadEdgeClearance:board.min_trace_to_pad_edge_clearance,minTraceToHoleEdgeClearance:board.min_trace_to_hole_edge_clearance,minViaHoleEdgeToViaHoleEdgeClearance:board.min_via_hole_edge_to_via_hole_edge_clearance,minPadEdgeToPadEdgeClearance:board.min_pad_edge_to_pad_edge_clearance,minBoardEdgeClearance:board.min_board_edge_clearance,minViaPadDiameter:.4572,minViaHoleDiameter:.254})
const shapes=input.obstacles.filter(o=>!o.circuitJsonMetadata?.pcb_via_id).map(o=>({kind:o.type==='circle'||o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers,own:o.connectedTo?.includes(owner)}))
for(const t of source.filter(t=>t.type==='pcb_trace'&&t.source_trace_id!==owner))for(const s of routeSegments(logical.find(l=>l.source_trace_id===t.source_trace_id)?.name??'',t.route))shapes.push({kind:'segment',a:s.a,b:s.b,w:s.width,layers:[s.layer],own:false})
for(const v of source.filter(v=>v.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,layers:v.layers,own:v.pcb_trace_id===trace.pcb_trace_id})
const pointSegment=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,f=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;return Math.hypot(p.x-a.x-f*dx,p.y-a.y-f*dy)}
const segmentDistance=(a,b,c,d)=>{const ux=b.x-a.x,uy=b.y-a.y,vx=d.x-c.x,vy=d.y-c.y,den=ux*vy-uy*vx;if(Math.abs(den)>1e-14){const t=((c.x-a.x)*vy-(c.y-a.y)*vx)/den,u=((c.x-a.x)*uy-(c.y-a.y)*ux)/den;if(t>=0&&t<=1&&u>=0&&u<=1)return 0}return Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b))}
const distance=(s,a,b)=>{if(s.kind==='circle')return pointSegment(s,a,b)-s.w/2;if(s.kind==='segment')return segmentDistance(a,b,s.a,s.b)-s.w/2;const x0=s.x-s.w/2,x1=s.x+s.w/2,y0=s.y-s.h/2,y1=s.y+s.h/2,inside=p=>p.x>=x0&&p.x<=x1&&p.y>=y0&&p.y<=y1;if(inside(a)||inside(b))return 0;const c=[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];return Math.min(...c.map((p,i)=>segmentDistance(a,b,p,c[(i+1)%4])))}
for(const s of shapes){s.left=s.kind==='segment'?Math.min(s.a.x,s.b.x)-s.w/2:s.x-s.w/2;s.right=s.kind==='segment'?Math.max(s.a.x,s.b.x)+s.w/2:s.x+s.w/2;s.low=s.kind==='segment'?Math.min(s.a.y,s.b.y)-s.w/2:s.y-s.h/2;s.high=s.kind==='segment'?Math.max(s.a.y,s.b.y)+s.w/2:s.y+s.h/2}
const legal=(a,b,layer)=>shapes.every(s=>s.own||!s.layers.includes(layer)||s.left>Math.max(a.x,b.x)+.16||s.right<Math.min(a.x,b.x)-.16||s.low>Math.max(a.y,b.y)+.16||s.high<Math.min(a.y,b.y)-.16||distance(s,a,b)-.0508>=.1046-1e-8)
const fullRoute=path=>{let layer='top';return[trace.route[0],...path.map(p=>{if(p.via){assert.equal(p.fromLayer,layer);const a={route_type:'via',x:p.x,y:p.y,from_layer:layer,to_layer:p.toLayer};layer=p.toLayer;return a}return{route_type:'wire',x:p.x,y:p.y,layer,width:.1016}}),trace.route.at(-1)]}
const foreign=source.filter(t=>t.type==='pcb_trace'&&t.source_trace_id!==owner).flatMap(t=>{const n=logical.find(s=>s.source_trace_id===t.source_trace_id)?.name;return mapping.some(m=>m.name===n)?routeSegments(n,t.route):[]})
let route=paths[name],measured=measureRouteExposure(name,fullRoute(route),foreign),before=measured;assert(Math.abs(before.exposureMm-32.17611222370479)<1e-8)
let tested=0;const cuts=[]
for(let pass=0;pass<12&&measured.exposureMm>31.74;pass++){
 const length=[0],exposure=[0];let layer='top';const layers=route.map(p=>{if(p.via)layer=p.toLayer;return layer})
 for(let i=1;i<route.length;i++){length[i]=length[i-1]+Math.hypot(route[i].x-route[i-1].x,route[i].y-route[i-1].y);const s=measured.segments.find(s=>s.routeIndex===i);exposure[i]=exposure[i-1]+(s?.exposureMm??0)}
 const candidates=[];let priorVia=-1
 for(let j=1;j<route.length;j++){
  if(route[j].via){priorVia=j;continue}if(route[j-1].via)continue
  for(let i=j-2;i>priorVia;i--){
   const span=Math.hypot(route[j].x-route[i].x,route[j].y-route[i].y),saving=length[j]-length[i]-span,nextLength=measured.planarMm-saving
   if(saving<.0001||nextLength<range[0]||nextLength>range[1]||!legal(route[i],route[j],layers[i]))continue
   // Prevent new contact with retained own copper or holes away from the cut.
   if(route.filter(p=>p.via).some(v=>pointSegment(v,route[i],route[j])<.2824))continue
   if(measured.segments.some(s=>s.layer===layers[i]&&(s.routeIndex<i-.0001||s.routeIndex>j+.0001)&&pointSegment(route[i],s.a,s.b)>.32&&pointSegment(route[j],s.a,s.b)>.32&&segmentDistance(route[i],route[j],s.a,s.b)<.2032))continue
   const s={name,netClass:'DQ1',a:route[i],b:route[j],layer:layers[i],width:.1016,length:span},newExposure=measureSegmentExposure(s,foreign).exposureMm,removedExposure=exposure[j]-exposure[i],afterExposure=measured.exposureMm-removedExposure+newExposure;tested++
   if(afterExposure<measured.exposureMm-1e-6)candidates.push({from:i,to:j,savingMm:saving,planarMm:nextLength,layer:layers[i],exposureMm:afterExposure,reducedExposureMm:measured.exposureMm-afterExposure})
  }
 }
 const best=candidates.sort((a,b)=>a.exposureMm-b.exposureMm||a.savingMm-b.savingMm)[0];if(!best)break
 route=route.filter((p,i)=>i<=best.from||i>=best.to);cuts.push(best);measured=measureRouteExposure(name,fullRoute(route),foreign);assert(Math.abs(measured.exposureMm-best.exposureMm)<1e-7);assert(Math.abs(measured.planarMm-best.planarMm)<1e-7)
}
mkdirSync(directory,{recursive:true});const snapshot=`${directory}/repair-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/repair-am3352-d12-spacing.mjs'))
const pass=measured.exposureMm<=31.75&&measured.planarMm>=range[0]&&measured.planarMm<=range[1],result={status:pass?'D12_GUARDED_SPACING_SHORTCUT_FOUND_REPLAY_AND_PHYSICAL_CHECKS_REQUIRED':'D12_GUARDED_SPACING_SHORTCUT_NOT_FOUND',source:summary.source,checkedSourceSummary:checked,priorPaths:summary.paths,signal:name,beforePlanarMm:before.planarMm,beforeExposureMm:before.exposureMm,afterPlanarMm:measured.planarMm,afterExposureMm:measured.exposureMm,byte1RelativeLengthRangeMm:range,classSpacingAllowanceMm:31.75,cuts,tested,wireGuardMm:.003,newPhysicalHoles:0,executionHelper:artifact(snapshot),spacingGeometryHelper:artifact('scripts/lib/am3352-ddr-spacing-geometry.mjs'),nativeBusLanesBootstrapRetained:true,fullElectricalTimingQualified:false,defaultChanged:false,fabricationReady:false}
if(pass){paths[name]=route;assert.deepEqual(paths[name].filter(p=>p.via),read(summary.paths.path)[name].filter(p=>p.via));const path=`${directory}/paths.json`;writeFileSync(path,JSON.stringify(paths,null,2)+'\n');result.paths=artifact(path)}
writeFileSync(`${directory}/result.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,beforeExposureMm:before.exposureMm,afterExposureMm:measured.exposureMm,afterPlanarMm:measured.planarMm,cuts:cuts.length,tested,newHoles:0,fabricationReady:false}));process.exitCode=pass?0:1
