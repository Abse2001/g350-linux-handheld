// Separate manual-routing trials. Keep terminal pads and all foreign copper fixed.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import * as checks from '@tscircuit/checks'
import {routeGuardedOuterBridge} from './lib/g350-ddr-timing-detour-bridge.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
const [input,root,signal,targetText,pointText='-15,-8;15,-8;-20,8;20,8']=process.argv.slice(2);assert(input&&root&&signal&&!fs.existsSync(root));fs.mkdirSync(root);const target=Number(targetText);assert(target>0&&target<100)
fs.copyFileSync('scripts/detour-g350-full-board-ddr.mjs',root+'/worker.executed.mjs');fs.copyFileSync('scripts/lib/g350-ddr-timing-detour-bridge.mjs',root+'/bridge.executed.mjs')
const baseline=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'));const st=baseline.find(e=>e.type==='source_trace'&&e.name===signal);assert(st?.name.startsWith('DDR_'));const original=baseline.find(e=>e.type==='pcb_trace'&&e.source_trace_id===st.source_trace_id);assert(original)
const viaIndexes=original.route.flatMap((p,i)=>p.route_type==='via'?[i]:[]);
const selection=process.env.G350_DDR_VIA_SPAN?.split(',').map(Number);
const first=selection?viaIndexes[selection[0]]:viaIndexes[0],last=selection?viaIndexes[selection[1]]:viaIndexes.at(-1);assert(first>=0&&last>first)
const parent=new Map();const find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)};for(const s of baseline.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p));
const layers=['inner1','inner2','top','bottom'],attempts=[];let accepted
const direct=process.env.G350_DDR_DIRECT_SHORTEN==='1';
for(const value of direct?['direct']:pointText.split(';')){
 const [x,y]=direct?[0,0]:value.split(',').map(Number);assert(Number.isFinite(x)&&Number.isFinite(y));const waypoint=direct?null:{x,y};const c=structuredClone(baseline),t=c.find(e=>e.pcb_trace_id===original.pcb_trace_id&&e.type==='pcb_trace');
 const shapes=[];const owners=new Map(c.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,e.source_trace_id]));
 for(const p of c.filter(e=>e.type==='pcb_smtpad')){const w=p.width??2*p.radius,h=p.height??w;if(Number.isFinite(w)&&Number.isFinite(h))shapes.push({kind:p.shape==='circle'?'circle':'rect',x:p.x,y:p.y,w,h,layers:[p.layer],pad:true,owner:'fixed_pad'})}
 const removedBarrels=original.route.slice(first+1,last).filter(p=>p.route_type==='via');
 for(const v of c.filter(e=>e.type==='pcb_via'&&(e.pcb_trace_id!==t.pcb_trace_id||!removedBarrels.some(p=>Math.hypot(p.x-e.x,p.y-e.y)<1e-6))))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers,owner:owners.get(v.pcb_trace_id)??'fixed_via'})
 // Retained terminal barrels are physical full-depth vias. Expose their real
 // layer access to the planner while retaining the drill as an obstacle.
 for(const point of [original.route[first],original.route[last]]){
  const v=c.find(e=>e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id&&Math.hypot(e.x-point.x,e.y-point.y)<1e-6);
  assert(v&&layers.every(l=>v.layers.includes(l))&&v.hole_diameter===.254&&v.outer_diameter===.4572);
  shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers,owner:st.source_trace_id});
 }
 const addRoute=(r,owner,trim=false)=>{for(let i=1;i<r.length;i++){const a=r[i-1],b=r[i];if(a.route_type!=='wire'||b.route_type!=='wire'||a.layer!==b.layer||Math.hypot(a.x-b.x,a.y-b.y)<1e-8)continue;let end=b;if(trim&&Math.hypot(b.x-x,b.y-y)<1e-8){const n=Math.hypot(a.x-b.x,a.y-b.y);if(n<=.7)continue;end={...b,x:b.x+(a.x-b.x)*.7/n,y:b.y+(a.y-b.y)*.7/n}}shapes.push({kind:'segment',a,b:end,w:b.width??.1016,layers:[a.layer],owner})}}
 for(const other of c.filter(e=>e.type==='pcb_trace'))if(other!==t)addRoute(other.route,other.source_trace_id);else{addRoute(original.route.slice(0,first+1),st.source_trace_id);addRoute(original.route.slice(last),st.source_trace_id)}
 const solve=(a,b)=>routeGuardedOuterBridge({connection:{name:st.source_trace_id,pointsToConnect:[a,b].map(p=>({...p,layer:'inner1'}))},shapes,searchBounds:{minX:-24,maxX:24,minY:-18,maxY:34},seconds:12,gridMm:.025,maxVias:Number(process.env.G350_DDR_MAX_VIAS??2),viaGrid:.025,routingLayers:layers,viaCopperClearance:.15,...(process.env.G350_DDR_EXACT_RASTER==='1'?{rasterGuardMm:0}:{})})
 const one=solve(original.route[first],direct?original.route[last]:waypoint);if(!one.route){attempts.push({waypoint,leg:1,error:one.error,expanded:one.expanded,startBlocked:one.startBlocked,goalBlocked:one.goalBlocked});fs.writeFileSync(root+'/attempts.json',JSON.stringify(attempts,null,2));continue}
 let two;
 if(direct)two={route:[structuredClone(one.route.at(-1))]};
 else{addRoute(one.route,'first_detour_leg',true);two=solve(waypoint,original.route[last]);if(!two.route){attempts.push({waypoint,leg:2,error:two.error,expanded:two.expanded});fs.writeFileSync(root+'/attempts.json',JSON.stringify(attempts,null,2));continue}}
 const head=structuredClone(original.route.slice(0,first+1)),tail=structuredClone(original.route.slice(last));head.at(-1).to_layer=one.route[0].layer;tail[0].from_layer=two.route.at(-1).layer;
 const transfer=one.route.at(-1).layer===two.route[0].layer?[]:[{route_type:'via',...waypoint,from_layer:one.route.at(-1).layer,to_layer:two.route[0].layer,via_diameter:.4572,via_hole_diameter:.254}];t.route=[...head,...one.route,...transfer,...two.route,...tail];delete t.trace_length
 for(let i=c.length-1;i>=0;i--)if(c[i].type==='pcb_via'&&c[i].pcb_trace_id===t.pcb_trace_id)c.splice(i,1)
 for(const [i,v]of t.route.filter(p=>p.route_type==='via').entries())c.push({type:'pcb_via',pcb_via_id:`detour_${t.pcb_trace_id}_${i}`,pcb_trace_id:t.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:t.subcircuit_id})
 const mm=ddrRouteLength(t.route),counts=Object.fromEntries(g350DdrPhysicalChecks.map(n=>[n,checks[n](c).length]));counts.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length;
 const oldMm=ddrRouteLength(original.route);const valid=Object.values(counts).every(n=>n===0)&&(direct?mm<oldMm-.5:mm<=target+.01&&mm>oldMm+.5);attempts.push({waypoint,direct,lengthMm:mm,beforeMm:oldMm,targetMm:target,counts,accepted:valid});fs.writeFileSync(root+'/attempts.json',JSON.stringify(attempts,null,2));fs.writeFileSync(root+`/trial-${attempts.length}.circuit.json`,JSON.stringify(c,null,2));console.log(JSON.stringify(attempts.at(-1)));if(valid){accepted=c;break}
}
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(accepted??baseline,null,2));console.log(JSON.stringify({signal,accepted:!!accepted}));
