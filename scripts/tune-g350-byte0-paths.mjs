import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {fanoutTracePath} from '@tscircuit/props'
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const dataSource='lib/am3352/placement/ddr-byte0-top-corridor-paths.json',strobeSource='lib/am3352/placement/ddr-dqs0-byte0-tuning-paths.json'
const data=read(dataSource),strobes=read(strobeSource),records=[]
const length=r=>r.slice(1).reduce((n,p,i)=>{const q=r[i];return n+(p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer?Math.hypot(p.x-q.x,p.y-q.y):0)},0)
const target=Math.max(...data.map(p=>length(p.route)))
const wire=(x,y,layer)=>({route_type:'wire',x,y,layer,width:.1016})
function tune(path,{x,start,n,direction}){
 const old=length(path.route),added=target-old
 if(added<1e-6)return path
 const height=.25,gap=.21,chamfer=.02
 const amplitude=(added/n+4*(2-Math.SQRT2)*chamfer)/2
 const end=start-n*height-(n-1)*gap
 const index=path.route.findIndex((a,i)=>{
  const b=path.route[i+1]
  return b&&a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&Math.abs(a.x-x)<1e-8&&Math.abs(b.x-x)<1e-8&&a.y>=start&&b.y<=end
 })
 assert(index>=0,`No straight segment for ${path.connection}`)
 assert(amplitude>2*chamfer&&height-2*chamfer>=.1016+.1016)
 const layer=path.route[index].layer,points=[wire(x,start,layer)]
 for(let i=0;i<n;i++){
  const y=start-i*(height+gap),a=amplitude,c=chamfer,d=direction
  if(i)points.push(wire(x,y,layer))
  points.push(wire(x+d*c,y-c,layer),wire(x+d*(a-c),y-c,layer),wire(x+d*a,y-2*c,layer),
   wire(x+d*a,y-height+2*c,layer),wire(x+d*(a-c),y-height+c,layer),wire(x+d*c,y-height+c,layer),wire(x,y-height,layer))
 }
 const route=[...path.route.slice(0,index+1),...points,...path.route.slice(index+1)]
 assert(Math.abs(length(route)-target)<1e-7)
 records.push({connection:path.connection,originalPlanarLengthMm:old,tunedPlanarLengthMm:length(route),loops:n,
  layer,laneX:x,startY:start,endY:end,direction,amplitudeMm:amplitude,barCenterSpacingMm:height-2*chamfer})
 return fanoutTracePath.parse({connection:path.connection,route})
}
const plans={
 'U_SOC.pin13':{x:-1.58101,start:8.7,n:8,direction:1},
 'U_SOC.pin30':{x:4.38101,start:12.1,n:3,direction:-1},
 'U_SOC.pin50':{x:3.21899,start:5.19,n:3,direction:-1},
 'U_SOC.pin49':{x:3.98101,start:5.30,n:4,direction:1},
 'U_SOC.pin48':{x:-2.38101,start:9,n:4,direction:-1},
 'U_SOC.pin67':{x:-3.18101,start:8.9,n:1,direction:-1},
 'U_SOC.pin31':{x:-.81899,start:8.85,n:11,direction:1},
}
const tunedData=data.map(p=>plans[p.connection]?tune(p,plans[p.connection]):p)
const tunedStrobes=strobes.map((p,i)=>tune(p,{x:i===0?.2:-.0216,start:4,n:2,direction:i===0?1:-1}))
assert.equal(tunedData.length,9);assert.equal(tunedStrobes.length,2)
const lengths=[...tunedData,...tunedStrobes].map(p=>length(p.route)),skew=Math.max(...lengths)-Math.min(...lengths)
assert(skew<=.635)
assert(Math.abs(length(tunedStrobes[0].route)-length(tunedStrobes[1].route))<=.127)
const out='lib/am3352/placement/ddr-byte0-matched-paths.json',strobeOut='lib/am3352/placement/ddr-dqs0-byte0-matched-paths.json'
writeFileSync(out,JSON.stringify(tunedData,null,2)+'\n');writeFileSync(strobeOut,JSON.stringify(tunedStrobes,null,2)+'\n')
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const report={status:'MATCHED_BYTE0_CANDIDATE_REQUIRES_PHYSICAL_CHECKS',targetPlanarLengthMm:target,planarSkewMm:skew,planarSkewLimitMm:.635,
 nativeBusLanesBootstrapUsed:true,manualCarrierAndLengthRepairs:true,nativeSevenCarriersRetainedExactly:false,
 records,dataSource:artifact(dataSource),strobeSource:artifact(strobeSource),data:artifact(out),strobes:artifact(strobeOut),
 electricalTimingQualified:false,fabricationReady:false}
writeFileSync('checks/integrated/g350-ddr-bootstrap/byte0-length-tuning.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,targetPlanarLengthMm:target,planarSkewMm:skew}))
