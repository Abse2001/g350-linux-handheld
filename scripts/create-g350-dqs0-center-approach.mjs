import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {fanoutTracePath} from '@tscircuit/props'

const originalPath='lib/am3352/placement/ddr-dqs0-native-paths.json'
const original=JSON.parse(readFileSync(originalPath,'utf8'))
const wire=(x,y,layer='bottom')=>({route_type:'wire',x,y,layer,width:.1016})
const via=(x,y)=>({route_type:'via',x,y,from_layer:'bottom',to_layer:'top',via_diameter:.4572,via_hole_diameter:.254})
const length=r=>r.slice(1).reduce((n,p,i)=>{const q=r[i];return n+(p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer?Math.hypot(p.x-q.x,p.y-q.y):0)},0)
const target=19.086260839907585
const paths=original.map((path,i)=>{
 const route=path.route.slice(0,6).map(p=>({...p}))
 const lane=i===0?.2:-.0216
 route.push(wire(lane,lane+route[5].y-route[5].x))
 if(i===0){
  // Use the unpopulated center of the sparse RAM grid to reverse the
  // strobe endpoint order without occupying adjacent data escape sites.
  route.push(wire(lane,1.8),wire(-.4,1.2),via(-.4,1.2),wire(-.4,1.2,'top'),wire(-.4,2.4,'top'),wire(-1.2,2.4,'top'),wire(-1.6,2,'top'))
 }else route.push(wire(lane,2.3),wire(-.3216,2),wire(-.8,2),wire(-1.2,1.6),via(-1.2,1.6),wire(-1.2,1.6,'top'),wire(-1.6,1.2,'top'))
 const added=target-length(route)
 assert(added>0&&added<4)
 const offset=added/(2*Math.SQRT2),direction=i===0?1:-1
 route.splice(7,0,wire(lane,8.5),wire(lane+direction*offset,8.5-offset),wire(lane+direction*offset,7.5-offset),wire(lane,7.5))
 assert(Math.abs(length(route)-target)<1e-8)
 assert.deepEqual(route[0],path.route[0])
 assert.deepEqual(route.at(-1),path.route.at(-1))
 assert.equal(route.filter(p=>p.route_type==='via').length,2)
 return fanoutTracePath.parse({connection:path.connection,route})
})
const output='lib/am3352/placement/ddr-dqs0-center-approach-paths.json'
writeFileSync(output,JSON.stringify(paths,null,2)+'\n')
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const report={status:'CENTER_STROBE_APPROACH_REQUIRES_PHYSICAL_AND_BYTE_ROUTING_CHECKS',
 nativeCpuDogbonesRetained:true,powerCopperAndComponentPlacementUnchanged:true,
 ramViaSites:[{signal:'DDR_DQS0',x:-.4,y:1.2},{signal:'DDR_DQSn0',x:-1.2,y:1.6}],
 planarLengthsMm:paths.map(p=>length(p.route)),planarSkewMm:0,
 source:artifact(originalPath),paths:artifact(output),fabricationReady:false,
 reason:'The prior left-hand strobe approach obstructed access to RAM data escape sites. Use the unpopulated center columns, with the positive strobe crossing the top-side empty center to a lower via, to keep the bottom paths ordered without crossing.'}
writeFileSync('checks/integrated/g350-ddr-bootstrap/dqs0-center-approach.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,planarLengthsMm:report.planarLengthsMm,ramViaSites:report.ramViaSites}))
