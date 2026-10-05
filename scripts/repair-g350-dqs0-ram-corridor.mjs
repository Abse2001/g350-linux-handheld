import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {fanoutTracePath} from '@tscircuit/props'

const originalPath='lib/am3352/placement/ddr-dqs0-native-paths.json'
const original=JSON.parse(readFileSync(originalPath,'utf8'))
assert.deepEqual(original.map(p=>p.connection),['U_SOC.pin14','U_SOC.pin32'])
const wire=(x,y)=>({route_type:'wire',x,y,layer:'bottom',width:.1016})
const length=r=>r.slice(1).reduce((n,p,i)=>{const q=r[i];return n+(p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer?Math.hypot(p.x-q.x,p.y-q.y):0)},0)
const routes=original.map((path,i)=>{
 const r=path.route,x=i===0?-1.6489410678:-1.8705410678
 const at=r.findIndex(p=>p.route_type==='wire'&&Math.abs(p.x-x)<1e-8&&p.y>6)
 assert.equal(at,6)
 const endY=i===0?2:1.2,lane=x-1.7
 const tailVia=r.findLastIndex(p=>p.route_type==='via')
 // Retain both native package dogbones and all four native via sites.
 // Take the coupled diagonal farther left, past every RAM power-via row.
 // Cross the sparse RAM via grid separately through its 0.8 mm row gaps.
 return [...r.slice(0,at),wire(lane,r[at].y-1.7),wire(lane,endY+.2),wire(lane+.2,endY),wire(-1.6,endY),...r.slice(tailVia-1)]
})
const added=length(routes[1])-length(routes[0])
assert(added>0&&added<2)
// Match planar length with one 45-degree excursion in the clear CPU/RAM
// corridor, on the outside of the positive signal. Keep endpoint geometry.
const r=routes[0],offset=added/(2*Math.SQRT2),diagonalConstant=r[5].y-r[5].x
const a=wire(1,1+diagonalConstant),b=wire(0,diagonalConstant)
r.splice(6,0,a,wire(a.x+offset,a.y-offset),wire(b.x+offset,b.y-offset),b)
const repaired=original.map((p,i)=>fanoutTracePath.parse({connection:p.connection,route:routes[i]}))
for(let i=0;i<2;i++){
 assert.deepEqual(repaired[i].route.filter(p=>p.route_type==='via'),original[i].route.filter(p=>p.route_type==='via'))
 assert.deepEqual(repaired[i].route[0],original[i].route[0])
 assert.deepEqual(repaired[i].route.at(-1),original[i].route.at(-1))
}
const lengths=repaired.map(p=>length(p.route)),skew=Math.abs(lengths[0]-lengths[1])
assert(skew<1e-8)
const path='lib/am3352/placement/ddr-dqs0-repaired-paths.json'
writeFileSync(path,JSON.stringify(repaired,null,2)+'\n')
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const report={status:'MANUAL_NATIVE_BOOTSTRAP_CORRIDOR_REPAIR_REQUIRES_CHECKS',
 nativeCpuDogbonesAndViaSitesRetained:true,nativeRamDogbonesAndViaSitesRetained:true,
 fixedPowerCopperUnchanged:true,ramCorridorShiftMm:1.7,lengthsMm:lengths,planarSkewMm:skew,
 matchedExcursionOffsetMm:offset,artifacts:[artifact(originalPath),artifact(path)],
 qualifiedDdrSignals:0,fabricationReady:false,
 reason:'Native fixed fanout traces describe top-to-plane connectivity, but their actual drills span all four layers. The bootstrap pair crossed three full-depth RAM power vias. Move the pair past these rows and approach the RAM signal vias through separate row gaps.'}
writeFileSync('checks/integrated/g350-ddr-bootstrap/dqs0-corridor-repair.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,lengthsMm:lengths,planarSkewMm:skew}))
