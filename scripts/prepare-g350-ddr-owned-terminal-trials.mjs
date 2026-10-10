// Explicit bounded D9-owned terminal trials. These are unqualified inputs for
// rerouting, never promoted boards. Foreign copper and holes stay exact.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
const [input,root]=process.argv.slice(2)
assert(input&&root&&!fs.existsSync(root))
const inputBytes=fs.readFileSync(input),hash=b=>createHash('sha256').update(b).digest('hex')
const baseline=JSON.parse(inputBytes).filter(e=>!e.type.includes('error'))
const source=baseline.find(e=>e.type==='source_trace'&&e.name==='DDR_D9');assert(source)
const trace=baseline.find(e=>e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id);assert(trace)
const vias=trace.route.filter(p=>p.route_type==='via');assert.equal(vias.length,2)
const guard=createG350LocalGuard(baseline,trace),trials=[],rejected=[]
fs.mkdirSync(root);fs.copyFileSync('scripts/prepare-g350-ddr-owned-terminal-trials.mjs',root+'/prepare.executed.mjs')
const offsets=[[0,.8],[0,-.8],[.8,0],[-.8,0],[.8,.8],[.8,-.8],[-.8,.8],[-.8,-.8],[0,1.2],[0,-1.2],[1.2,0],[-1.2,0],[.4,.4],[.4,-.4],[-.4,.4],[-.4,-.4]]
for(let terminal=0;terminal<2;terminal++)for(const [dx,dy] of offsets){
 assert(Math.hypot(dx,dy)<=1.5)
 const old=vias[terminal],x=old.x+dx,y=old.y+dy,end=terminal===0?trace.route[0]:trace.route.at(-1)
 const landPass=Math.hypot(x-end.x,y-end.y)>=.53&&['top','inner1','inner2','bottom'].every(layer=>guard([{route_type:'wire',x:x-.00001,y,layer,width:.4572},{route_type:'wire',x:x+.00001,y,layer,width:.4572}]))
 if(!landPass){rejected.push({terminal,dx,dy,reason:'Conservative all-layer land/pad clearance'});continue}
 const c=structuredClone(baseline),t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id)
 for(const p of t.route)if(Math.hypot(p.x-old.x,p.y-old.y)<1e-8){p.x=x;p.y=y}
 assert.deepEqual([t.route[0],t.route.at(-1)],[trace.route[0],trace.route.at(-1)])
 const physical=c.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===trace.pcb_trace_id&&Math.hypot(e.x-old.x,e.y-old.y)<1e-8);assert.equal(physical.length,1)
 const id=physical[0].pcb_via_id;physical[0].x=x;physical[0].y=y
 const fixed=j=>j.filter(e=>!(e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id)&&!(e.type==='pcb_via'&&e.pcb_via_id===id))
 assert.deepEqual(fixed(c),fixed(baseline))
 const original=baseline.find(e=>e.type==='pcb_via'&&e.pcb_via_id===id),omit=v=>Object.fromEntries(Object.entries(v).filter(([k])=>!['x','y'].includes(k)))
 assert.deepEqual(omit(physical[0]),omit(original))
 // Test each contiguous top stub separately; do not invent a wire across the
 // intervening inner channel when screening the CPU/RAM approaches.
 let stubPass=true
 for(let i=1;i<t.route.length;i++){const a=t.route[i-1],b=t.route[i];if(a.route_type==='wire'&&b.route_type==='wire'&&a.layer==='top'&&b.layer==='top')stubPass&&=guard([a,b])}
 if(!stubPass){rejected.push({terminal,dx,dy,reason:'Conservative foreign-copper top-stub clearance'});continue}
 const name='trial-'+(trials.length+1)+'.unqualified.circuit.json',path=root+'/'+name
 fs.writeFileSync(path,JSON.stringify(c,null,2)+'\n')
 trials.push({path,sha256:hash(fs.readFileSync(path)),terminal,dx,dy,pcbViaId:id,before:{x:old.x,y:old.y},after:{x,y},allForeignCopperHolesAndEndpointPadsExactlyPreserved:true,requiresCompleteRerouteGroundSourceAndIndependentQualification:true})
}
assert.equal(hash(fs.readFileSync(input)),hash(inputBytes))
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:hash(inputBytes)},trials,rejected,originalHoleIdsDimensionsAndFullDepthPreserved:true,maximumOwnedDisplacementMm:1.5,unqualifiedPlanningInputsOnly:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({trials,rejectedCount:rejected.length}))
