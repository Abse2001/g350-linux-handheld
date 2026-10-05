import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {getSimpleRouteJsonFromCircuitJson} from '@tscircuit/core'
import {routeGuardedOuterBridge} from './lib/am3352-guarded-outer-bridge.mjs'

// Retain the previously checked native D3 meander and seek fresh package
// access paths around the CASn repair. Only D3's four provisional holes move.
const [sourcePath,pathsPath,directory,headArg='70',secondsArg='30']=process.argv.slice(2)
assert(sourcePath&&pathsPath&&directory&&!existsSync(`${directory}/result.json`))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const audit=read('checks/integrated/am3352-ddr-usbc-casn-d3-coupled-source-validation.json');assert.deepEqual(audit.source,artifact(sourcePath));assert.deepEqual(audit.paths,artifact(pathsPath))
const source=read(sourcePath),old=read(audit.previousSource.path),paths=read(pathsPath),owner='source_trace_42',b=source.find(e=>e.type==='pcb_board')
const current=source.find(e=>e.type==='pcb_trace'&&e.source_trace_id===owner),original=old.find(e=>e.type==='pcb_trace'&&e.source_trace_id===owner);assert(current&&original)
const head=Number(headArg);assert(head>=17&&head<=90)
const retained=original.route.slice(head,504);assert(retained.every(p=>p.route_type==='wire'&&p.layer==='bottom'&&p.width===.1016))
assert(Math.abs(retained[0].x/.02-Math.round(retained[0].x/.02))<1e-6);assert(Math.abs(retained[0].y/.02-Math.round(retained[0].y/.02))<1e-6)
const ownHoles=source.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===current.pcb_trace_id);assert.equal(ownHoles.length,4)
const otherHoles=source.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id!==current.pcb_trace_id);assert.equal(otherHoles.length,165)
const {simpleRouteJson:input}=getSimpleRouteJsonFromCircuitJson({circuitJson:source,minTraceWidth:.1016,nominalTraceWidth:.1016,
 minTraceToPadEdgeClearance:b.min_trace_to_pad_edge_clearance,minTraceToHoleEdgeClearance:b.min_trace_to_hole_edge_clearance,
 minViaHoleEdgeToViaHoleEdgeClearance:b.min_via_hole_edge_to_via_hole_edge_clearance,minPadEdgeToPadEdgeClearance:b.min_pad_edge_to_pad_edge_clearance,
 minBoardEdgeClearance:b.min_board_edge_clearance,minViaPadDiameter:.4572,minViaHoleDiameter:.254})
input.traces=input.traces.filter(t=>t.source_trace_id!==owner)
input.obstacles=input.obstacles.filter(o=>{const v=ownHoles.find(v=>Math.hypot(o.center.x-v.x,o.center.y-v.y)<1e-8&&o.shape==='circle'&&o.width===v.outer_diameter);if(v)assert(!o.circuitJsonMetadata?.pcb_smtpad_id);return !v})
input.traces.push({pcb_trace_id:'retained_checked_d3_meander',source_trace_id:owner,connection_name:owner,route:retained})
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,912)
const layers=['top','bottom'],shapes=[]
for(const o of input.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.includes(owner)?owner:undefined})
for(const t of input.traces){const name=t.source_trace_id??t.connection_name;for(let i=0;i<t.route.length;i++){const p=t.route[i];if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:.4572,h:.4572,hole:.254,layers,owner:name});if(i){const a=t.route[i-1],c=p;if(Math.hypot(a.x-c.x,a.y-c.y)>1e-8)shapes.push({kind:'segment',a,b:c,w:Math.max(a.width??.1016,c.width??.1016),layers:[a.route_type==='wire'?a.layer:c.layer],owner:name})}}}
for(const v of otherHoles)shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers})
const st=source.find(e=>e.type==='source_trace'&&e.source_trace_id===owner),pads=st.connected_source_port_ids.map(id=>source.find(e=>e.type==='pcb_port'&&e.source_port_id===id))
const searchBounds={minX:-17.5,maxX:17.5,minY:-38.5,maxY:9.5},results=[]
const endpoints=[[{x:pads[0].x,y:pads[0].y,layer:'top'},retained[0]],[retained.at(-1),{x:pads[1].x,y:pads[1].y,layer:'top'}]]
for(const pointsToConnect of endpoints){
 const r=routeGuardedOuterBridge({connection:{name:owner,source_trace_id:owner,pointsToConnect},shapes,searchBounds,seconds:Number(secondsArg),gridMm:.02,maxVias:6,viaGrid:.02});results.push(r)
 if(!r.route)break
 const vias=r.route.filter(p=>p.route_type==='via');let valid=true
 for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)if(Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)<.508-1e-8)valid=false
 if(!valid){delete r.route;r.error='New holes fail mutual drill separation';break}
 for(let i=0;i<r.route.length;i++){const p=r.route[i];if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:.4572,h:.4572,hole:.254,layers,owner});if(i){const a=r.route[i-1];if(Math.hypot(a.x-p.x,a.y-p.y)>1e-8)shapes.push({kind:'segment',a,b:p,w:.1016,layers:[a.route_type==='wire'?a.layer:p.layer],owner})}}
}
const solved=results.length===2&&results.every(r=>r.route)
mkdirSync(directory,{recursive:true});const snapshot=`${directory}/manual-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/repair-am3352-d3-retained-meander.mjs'))
const report={status:solved?'D3_RETAINED_NATIVE_MEANDER_PACKAGE_REPAIRS_FOUND_UNQUALIFIED':'D3_RETAINED_NATIVE_MEANDER_PACKAGE_REPAIR_FAILED',source:artifact(sourcePath),priorPaths:artifact(pathsPath),originalCheckedSource:audit.previousSource,
 sourceAudit:artifact('checks/integrated/am3352-ddr-usbc-casn-d3-coupled-source-validation.json'),retainedOriginalRouteIndices:[head,503],retainedReferenceLengthMm:retained.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-retained[i].x,p.y-retained[i].y),0),
 temporarilyOmittedProvisionalD3Holes:ownHoles.map(v=>({id:v.pcb_via_id,x:v.x,y:v.y})),allOther165HolesRetained:true,all912PadsRetained:true,allOtherCopperRetained:true,actualPackageEndpoints:pads.map(p=>({x:p.x,y:p.y,layer:'top'})),searchBounds,results:results.map(({route,...r})=>r),executionHelpers:[artifact(snapshot),artifact('scripts/lib/am3352-guarded-outer-bridge.mjs')],copperLayers:4,defaultChanged:false,fabricationReady:false,timingQualified:false}
if(solved){const clean=[];for(const p of [...results[0].route,...retained,...results[1].route]){const q=clean.at(-1);if(q&&p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer&&Math.hypot(p.x-q.x,p.y-q.y)<1e-8)continue;clean.push(p)}
 let layer='top';paths.DDR_D3=clean.map(p=>{if(p.route_type==='via'){assert.equal(p.from_layer,layer);layer=p.to_layer;return{x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}}assert.equal(p.layer,layer);return{x:p.x,y:p.y}});assert.equal(layer,'top')
 report.fullD3PlanarMm=paths.DDR_D3.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-paths.DDR_D3[i].x,p.y-paths.DDR_D3[i].y),0);report.newD3Vias=paths.DDR_D3.filter(p=>p.via).length
 const path=`${directory}/paths.json`;writeFileSync(path,JSON.stringify(paths,null,2)+'\n');report.paths=artifact(path)
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,results:report.results,fullD3PlanarMm:report.fullD3PlanarMm,newD3Vias:report.newD3Vias}));process.exitCode=solved?0:1
