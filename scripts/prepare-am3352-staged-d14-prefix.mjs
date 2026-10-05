import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenCpuTails} from './lib/am3352-open-cpu-tails.mjs'

const [channelDirectory,directory]=process.argv.slice(2);assert(channelDirectory&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const channelPath=`${channelDirectory}/result.json`,channel=read(channelPath)
assert.equal(channel.status,'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED');assert.equal(channel.exportable,false)
const {summary,registration}=readCheckedCommandSummary(channel.checkedSourceSummary);assert.equal(registration.signals,27)
for(const a of [channel.source,channel.output,channel.temporaryOpenCpuTails])assert.equal(hash(a.path),a.sha256)
const source=read(channel.source.path),input=read(channel.output.path)
const tails=assertOpenCpuTails(channel,{...input,traces:input.traces.slice(0,129)},source)
const d10=tails.find(t=>t.name==='DDR_D10'),d14=tails.find(t=>t.name==='DDR_D14')
const pointSegment=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
const distance=(a,b,c,d)=>{const ux=b.x-a.x,uy=b.y-a.y,vx=d.x-c.x,vy=d.y-c.y,den=ux*vy-uy*vx;if(Math.abs(den)>1e-14){const t=((c.x-a.x)*vy-(c.y-a.y)*vx)/den,u=((c.x-a.x)*uy-(c.y-a.y)*ux)/den;if(t>=0&&t<=1&&u>=0&&u<=1)return 0}return Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b))}
const segments=r=>r.slice(1).flatMap((p,i)=>{const a=r[i];return a.route_type==='wire'&&p.route_type==='wire'&&a.layer===p.layer&&Math.hypot(a.x-p.x,a.y-p.y)>1e-8?[{a,b:p,layer:p.layer}]:[]})
let minimumCopperEdgeGapMm=Infinity
for(const a of segments(d10.originalRoute))for(const t of input.traces.slice(129))for(const b of segments(t.route))if(a.layer===b.layer)minimumCopperEdgeGapMm=Math.min(minimumCopperEdgeGapMm,distance(a.a,a.b,b.a,b.b)-.1016)
assert(minimumCopperEdgeGapMm>=.1046-1e-8,'The staged command collides with restored D10')
input.traces.find(t=>t.source_trace_id===d10.sourceTraceId).route=structuredClone(d10.originalRoute)
const st=source.find(e=>e.type==='source_trace'&&e.name==='DDR_D14')
input.connections=[{name:st.source_trace_id,source_trace_id:st.source_trace_id,width:.1016,nominalTraceWidth:.1016,
  pointsToConnect:st.connected_source_port_ids.map(id=>{const p=source.find(e=>e.type==='pcb_port'&&e.source_port_id===id);return{x:p.x,y:p.y,layer:'top',pcb_port_id:p.pcb_port_id,pointId:p.pcb_port_id}})}]
input.buses=[{name:'DDR_CPU_PREFIX_REBUILD',busId:'DDR_CPU_PREFIX_REBUILD',connectionNames:[st.source_trace_id],traceWidth:.1016,allowedLayers:['top'],maxLengthSkew:.635}];input.differentialPairs=[]
mkdirSync(directory,{recursive:true});const write=(name,value)=>{const path=`${directory}/${name}`;writeFileSync(path,JSON.stringify(value,null,2)+'\n');return artifact(path)}
const report={status:'STAGED_D14_CPU_PREFIX_REPAIR_D10_RESTORED_NOT_EXPORTABLE',source:summary.source,input:write('input.simple-route.json',input),
  checkedSourceSummary:channel.checkedSourceSummary,memoryMap:summary.memoryMap,ramReferenceLayout:summary.ramReferenceLayout,
  sourceCopper:{traces:129,totalSourceTraces:132},preparedLocalEscapes:0,preservedSavedDdr:{...summary.paths,signals:27},
  temporaryOpenCpuTails:channel.temporaryOpenCpuTails,restoredCpuPrefixNames:['DDR_D10'],restoredD10CommandCopperPreflight:{minimumCopperEdgeGapMm,wireGuardMm:.003},stagedFixedCopper:write('staged-fixed-copper.json',input.traces.slice(129)),
  cpuPrefixRebuild:{name:'DDR_D14',sourceTraceId:st.source_trace_id,target:{x:d14.retainedTail[0].x,y:d14.retainedTail[0].y,layer:'top'},stagedNativeCommand:artifact(channelPath)},
  actualPackagePadStartsAllowed:true,allChannelEndpointsActualTopPads:true,pendingCpuTailRepairs:1,exportable:false,defaultChanged:false,fabricationReady:false}
assertOpenCpuTails(report,{...input,traces:input.traces.slice(0,129)},source)
write('signal-escapes.native.json',[]);write('result.json',report)
console.log(JSON.stringify({status:report.status,minimumCopperEdgeGapMm,target:report.cpuPrefixRebuild.target,retainedThroughVias:147,fabricationReady:false}))
