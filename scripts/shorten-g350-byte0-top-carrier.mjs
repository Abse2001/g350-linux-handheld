import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {fanoutTracePath} from '@tscircuit/props'
const original='lib/am3352/placement/ddr-byte0-repaired-paths.json'
const paths=JSON.parse(readFileSync(original,'utf8'))
const wire=(x,y,layer)=>({route_type:'wire',x,y,layer,width:.1016})
const via=(x,y,from_layer,to_layer)=>({route_type:'via',x,y,from_layer,to_layer,via_diameter:.4572,via_hole_diameter:.254})
const i=paths.findIndex(p=>p.connection==='U_SOC.pin68');assert(i>=0)
const previous=paths[i]
// The BGA's 0.8 mm grid leaves a legal Top corridor at x=4.8, between
// columns 4.4 and 5.2. Check it against actual pads and fixed copper in the
// fresh source build; package body graphics are not copper obstacles.
paths[i]=fanoutTracePath.parse({connection:previous.connection,route:[
 wire(3.6,15.6,'top'),wire(4,16,'top'),via(4,16,'top','bottom'),wire(4,16,'bottom'),
 wire(4.8,16,'bottom'),via(4.8,16,'bottom','top'),wire(4.8,16,'top'),
 wire(4.8,12.4,'top'),wire(.8,8.4,'top'),wire(.8,0,'top'),wire(1.2,0,'top'),wire(1.6,.4,'top'),
]})
const length=r=>r.slice(1).reduce((n,p,i)=>{const q=r[i];return n+(p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer?Math.hypot(p.x-q.x,p.y-q.y):0)},0)
assert.equal(paths[i].route.filter(p=>p.route_type==='via').length,2)
assert.deepEqual(paths[i].route[0],previous.route[0]);assert.deepEqual(paths[i].route.at(-1),previous.route.at(-1))
const out='lib/am3352/placement/ddr-byte0-top-corridor-paths.json'
writeFileSync(out,JSON.stringify(paths,null,2)+'\n')
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const report={status:'SHORTER_TOP_CARRIER_REQUIRES_ACTUAL_SOURCE_CHECKS',original:artifact(original),paths:artifact(out),
 connection:previous.connection,previousPlanarLengthMm:length(previous.route),newPlanarLengthMm:length(paths[i].route),
 nativeSevenCarriersRetainedExactly:true,twoThroughVias:true,innerLayersRemainReferences:true,
 fabricationReady:false,ddrTimingQualified:false}
writeFileSync('checks/integrated/g350-ddr-bootstrap/byte0-top-corridor-repair.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,newPlanarLengthMm:report.newPlanarLengthMm}))
