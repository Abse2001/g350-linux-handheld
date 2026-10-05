import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {fanoutTracePath} from '@tscircuit/props'

const read=p=>JSON.parse(readFileSync(p,'utf8'))
const nativePath='lib/am3352/placement/ddr-byte0-seven-native-paths.json'
const escapePath='checks/integrated/g350-ddr-bootstrap/byte0-native-escapes.traces.json'
const strobePath='lib/am3352/placement/ddr-dqs0-center-approach-paths.json'
const native=read(nativePath),escapes=read(escapePath),strobes=read(strobePath)
const wire=(x,y,layer='bottom')=>({route_type:'wire',x,y,layer,width:.1016})
const via=(x,y,from_layer='top',to_layer='bottom')=>({route_type:'via',x,y,from_layer,to_layer,via_diameter:.4572,via_hole_diameter:.254})
const length=r=>r.slice(1).reduce((n,p,i)=>{const q=r[i];return n+(p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer?Math.hypot(p.x-q.x,p.y-q.y):0)},0)
const reverse=r=>r.slice().reverse().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p})
const branches=escapes.filter(t=>t.source_trace_id==='source_trace_42')
assert.equal(branches.length,2)
const cpu=branches.find(t=>t.route[0].y>10),ram=branches.find(t=>t.route[0].y<10)
const head=[wire(3.2,13.6),wire(3.0720425686445316,13.472042568644532),wire(3.0720425686445316,12.791080230634696)]
head.push(wire(-.81899,12.791080230634696-3.0720425686445316-.81899),wire(-.81899,2.78101),wire(-1.58101,2.01899),wire(-1.58101,.38101),wire(-1.2,0))
const d3=fanoutTracePath.parse({connection:'U_SOC.pin31',route:[...cpu.route,...head.slice(1),...reverse(ram.route).slice(1)]})
// This signal uses two full-depth through-vias near the CPU. Its main
// carrier uses Top over the ground reference, and enters RAM through the
// empty center columns without a RAM via. No inner signal copper is added.
const d7=fanoutTracePath.parse({connection:'U_SOC.pin68',route:[
 wire(3.6,15.6,'top'),wire(4,16,'top'),via(4,16),wire(4,16),
 wire(7.2,16),wire(8,15.2),via(8,15.2,'bottom','top'),wire(8,15.2,'top'),
 wire(8,8,'top'),wire(7.2,7.2,'top'),wire(.8,7.2,'top'),wire(.8,0,'top'),wire(1.2,0,'top'),wire(1.6,.4,'top'),
]})
const paths=[...native,d3,d7]
assert.equal(paths.length,9)
assert(paths.every(p=>p.route.filter(q=>q.route_type==='via').length===2))
// Replace the negative strobe's one wide tuning excursion with three
// smaller ones. Preserve its complete planar length and both endpoints.
const old=strobes[1],r=old.route
assert.equal(r[7].y,8.5)
const base=[...r.slice(0,7),...r.slice(11)]
const extra=length(r)-length(base),delta=extra/(6*Math.SQRT2),x=-.0216
const tuned=[...base.slice(0,7)]
for(const y of [8.8,7.2,5.6])tuned.push(wire(x,y),wire(x-delta,y-delta),wire(x-delta,y-1-delta),wire(x,y-1))
tuned.push(...base.slice(7))
assert(Math.abs(length(tuned)-length(r))<1e-8)
const newStrobes=[strobes[0],fanoutTracePath.parse({connection:old.connection,route:tuned})]
const out='lib/am3352/placement/ddr-byte0-repaired-paths.json',strobeOut='lib/am3352/placement/ddr-dqs0-byte0-tuning-paths.json'
writeFileSync(out,JSON.stringify(paths,null,2)+'\n')
writeFileSync(strobeOut,JSON.stringify(newStrobes,null,2)+'\n')
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const report={status:'COMPLETE_BYTE0_CANDIDATE_REQUIRES_PHYSICAL_AND_TIMING_CHECKS',nativeFullNineLaneSolve:false,
 nativeCarrierPathsRetainedExactly:7,manualCarrierPaths:2,twoThroughViasPerDataPath:true,
 manualStrobeTuningRelocation:true,strobePlanarLengthsMm:newStrobes.map(p=>length(p.route)),
 dataPlanarLengthsMm:paths.map(p=>({connection:p.connection,length:length(p.route)})),
 nativePaths:artifact(nativePath),nativeEscapes:artifact(escapePath),originalStrobes:artifact(strobePath),paths:artifact(out),strobes:artifact(strobeOut),
 qualifiedNewDdrSignals:0,ddrTimingQualified:false,fabricationReady:false}
writeFileSync('checks/integrated/g350-ddr-bootstrap/byte0-last-two-repair.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,dataPlanarLengthsMm:report.dataPlanarLengthsMm,strobePlanarLengthsMm:report.strobePlanarLengthsMm}))
