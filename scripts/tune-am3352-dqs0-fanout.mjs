import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Balance the actual saved DQS local copper before coupled channel tuning.
// Insert two chamfered, 45-degree trombones on the CPU's outer top escape;
// no pads, vias, net identities, clearance rules or timing limits move.
const [inputDirectory,directory]=process.argv.slice(2);assert(inputDirectory&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const inputPath=`${inputDirectory}/channel.input.simple-route.json`,input=read(inputPath),prior=read(`${inputDirectory}/result.json`)
const pair=input.differentialPairs[0];assert.deepEqual(pair.connectionNames,['source_trace_15','source_trace_16'])
const length=r=>r.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-r[i].x,p.y-r[i].y),0)
const fixedLength=n=>input.traces.filter(t=>t.source_trace_id===n||t.connection_name===n).reduce((sum,t)=>sum+length(t.route),0)
const before=pair.connectionNames.map(fixedLength),delta=before[1]-before[0]
assert(delta>0&&delta<2.2)
const trace=input.traces.find(t=>t.pcb_trace_id==='guided_local_dogbone_source_trace_15_0')
const original=structuredClone(trace.route),a=trace.route[0],b=trace.route[1]
assert.equal(a.layer,'top');assert.equal(b.layer,'top')
assert(Math.abs(a.x-4)<1e-6&&Math.abs(b.x-4)<1e-6&&a.y>-7.21&&b.y<-8.21)
const chamfer=.04,height=.21,pitch=.42,startY=-7.53
const amplitude=(delta+8*chamfer*(2-Math.SQRT2))/4
const points=[]
const wire=(x,y)=>({route_type:'wire',x,y,layer:'top',width:.1016})
for(let i=0;i<2;i++){
  const y=startY-i*pitch,x=a.x,left=x-amplitude
  points.push(wire(x,y+chamfer),wire(x-chamfer,y),wire(left+chamfer,y),wire(left,y-chamfer),
    wire(left,y-height+chamfer),wire(left+chamfer,y-height),wire(x-chamfer,y-height),wire(x,y-height-chamfer))
}
trace.route=[a,...points,...trace.route.slice(1)]
const after=pair.connectionNames.map(fixedLength)
assert(Math.abs(after[0]-after[1])<1e-7)
assert.deepEqual(trace.route.at(-1),original.at(-1))
mkdirSync(directory,{recursive:true})
const path=`${directory}/channel.input.simple-route.json`;writeFileSync(path,JSON.stringify(input)+'\n')
const report={...prior,status:'DQS0_FANOUT_PLANAR_LENGTHS_BALANCED_PENDING_PHYSICAL_CHECKS',
  priorHandoffInput:{path:inputPath,sha256:hash(inputPath)},
  manualDqs0Tuning:{trace:trace.pcb_trace_id,layer:'top',addedLengthMm:delta,beforeFixedLengthsMm:before,
    afterFixedLengthsMm:after,amplitudeMm:amplitude,chamferMm:chamfer,loopHeightMm:height,newVias:0},
  channel:{...prior.channel,input:{path,sha256:hash(path)},solved:false},fabricationReady:false,timingQualified:false}
delete report.output
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
writeFileSync(`${directory}/local-escapes.json`,JSON.stringify(input.traces.filter(t=>t.pcb_trace_id.startsWith('guided_local_dogbone_')),null,2)+'\n')
console.log(JSON.stringify(report.manualDqs0Tuning))
