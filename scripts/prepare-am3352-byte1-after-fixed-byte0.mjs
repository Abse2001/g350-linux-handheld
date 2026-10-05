import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSavedDdrCopper} from './lib/am3352-saved-ddr-copper.mjs'

const [bootstrap,directory,mode]=process.argv.slice(2);assert(bootstrap&&directory)
assert(mode===undefined||['all-cpu-top','prune-ram-command','ram-byte-vias-command-tips','all-command-pad-starts'].includes(mode))
const allCpuTop=mode==='all-cpu-top'
const ramByteVias=mode==='ram-byte-vias-command-tips'
const commandPadStarts=mode==='all-command-pad-starts'
const pruneRamCommand=mode==='prune-ram-command'||ramByteVias||commandPadStarts
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),input=read(prior.input.path)
assert.equal(hash(prior.source.path),prior.source.sha256);assert.equal(hash(prior.input.path),prior.input.sha256)
const source=read(prior.source.path)
const copper=assertSavedDdrCopper(source,read(prior.preservedSavedDdr.path),{ramRotation:180,rotatedD2PowerBridge:true,
 ramReferenceEscapes:read(prior.ramReferenceLayout.path)})
assert.equal(copper.savedDdrSignals,11);assert.equal(copper.totalSourceTraces,81)
const nativePath=`${bootstrap}/signal-escapes.native.json`,native=read(nativePath)
assert.equal(native.length,74)
const byte=input.buses.find(b=>b.name==='DDR_BYTE1'),command=input.buses.find(b=>b.name==='DDR_COMMAND_CLOCK')
assert.deepEqual(byte.allowedLayers,['top']);assert.deepEqual(command.allowedLayers,['top'])
const byteIds=new Set(byte.connectionNames),commandIds=new Set(command.connectionNames)
const pair=new Set(input.differentialPairs.find(p=>p.connectionNames.every(n=>byteIds.has(n))).connectionNames)
const actualPads=[],commandTips=[]
const edited=native.map(t=>{
 const cpu=t.pcb_trace_id.endsWith('_0')
 if(byteIds.has(t.source_trace_id)&&(cpu?(allCpuTop||!pair.has(t.source_trace_id)):!ramByteVias)){
  const c=input.connections.find(c=>c.name===t.source_trace_id),p=c.pointsToConnect[cpu?0:1]
  assert.equal(p.layer,'top');assert(Math.hypot(t.route[0].x-p.x,t.route[0].y-p.y)<1e-6)
  actualPads.push({traceId:t.pcb_trace_id,package:cpu?'U_SOC':'U_RAM',signal:source.find(e=>e.type==='source_trace'&&e.source_trace_id===t.source_trace_id).name,
   point:{x:p.x,y:p.y,layer:'top'}})
  return {...t,route:[{...t.route[0]}]}
 }
 if((cpu||pruneRamCommand)&&commandIds.has(t.source_trace_id)){
  assert.equal(t.route.findIndex(p=>p.route_type==='via'),2)
  const c=input.connections.find(c=>c.name===t.source_trace_id),p=c.pointsToConnect[cpu?0:1]
  assert.equal(p.layer,'top');assert(Math.hypot(t.route[0].x-p.x,t.route[0].y-p.y)<1e-6)
  commandTips.push(t.pcb_trace_id);return {...t,route:structuredClone(t.route.slice(0,commandPadStarts?1:2))}
 }
 return structuredClone(t)
})
assert.equal(actualPads.filter(p=>p.package==='U_SOC').length,allCpuTop?11:9)
assert.equal(actualPads.filter(p=>p.package==='U_RAM').length,ramByteVias?0:11);assert.equal(commandTips.length,pruneRamCommand?52:26)
const nativeThroughBranches=ramByteVias?13:pruneRamCommand?2:allCpuTop?26:28
assert.equal(edited.flatMap(t=>t.route).filter(p=>p.route_type==='via').length,nativeThroughBranches)
mkdirSync(directory,{recursive:true})
const inputPath=`${directory}/input.simple-route.json`,editedPath=`${directory}/signal-escapes.native.json`
writeFileSync(inputPath,readFileSync(prior.input.path));writeFileSync(editedPath,JSON.stringify(edited,null,2)+'\n')
const correction={priorNative:{path:nativePath,sha256:hash(nativePath)},editedNative:{path:editedPath,sha256:hash(editedPath)},
 exactPadStarts:actualPads,retainedCpuCommandTopTips:commandTips.filter(id=>id.endsWith('_0')),
 retainedRamCommandTopTips:commandTips.filter(id=>id.endsWith('_1')),remainingNativeThroughBranches:nativeThroughBranches,
 retainedCpuStrobeThroughBranches:allCpuTop?0:2,retainedRamCommandThroughBranches:pruneRamCommand?0:26,
 retainedRamByte1ThroughBranches:ramByteVias?11:0,
 commandDescriptorsAreActualPadMarkers:commandPadStarts,commandTopPadMarkers:commandPadStarts?52:0,
 prunedUnmanufacturedRamCommandViaBranches:pruneRamCommand?26:0,actualSourceCopperUnchanged:true,physicallyQualified:false}
const report={...prior,status:commandPadStarts?'FIXED_BYTE0_COMMAND_ACTUAL_PAD_MARKERS_BYTE1_PENDING_ROUTING':ramByteVias?'FIXED_BYTE0_BYTE1_RAM_NATIVE_VIAS_COMMAND_TOP_TIPS_PENDING_ROUTING':pruneRamCommand?'FIXED_BYTE0_BYTE1_PAD_STARTS_COMMAND_TOP_TIPS_PENDING_ROUTING':allCpuTop?'FIXED_BYTE0_BYTE1_ALL_ACTUAL_TOP_PAD_STARTS_PENDING_ROUTING':'FIXED_BYTE0_BYTE1_ACTUAL_PAD_STARTS_AND_BOTTOM_STROBES_PENDING_ROUTING',
 input:{path:inputPath,sha256:hash(inputPath)},manualByte1AfterByte0Correction:correction,
 manualCpuPadStartCorrection:{kind:allCpuTop?'ELEVEN_BYTE1_CPU_ACTUAL_PAD_STARTS':'NINE_BYTE1_CPU_ACTUAL_PAD_STARTS',...correction},
 manualRamNativeTipCorrection:{kind:ramByteVias?'ELEVEN_BYTE1_RAM_NATIVE_THROUGH_BRANCHES_RETAINED':'ELEVEN_BYTE1_RAM_ACTUAL_PAD_STARTS',...correction},
 completedSignalChannels:0,fabricationReady:false,timingQualified:false,
 scope:`Actual byte0 routes and all physical source copper remain fixed. ${allCpuTop?'Eleven':'Nine'} CPU byte1 starts are exact top pads; ${ramByteVias?'eleven RAM byte1 native through-via branches are retained':'eleven RAM byte1 starts are exact top-pad markers'}; ${allCpuTop?'CPU strobe native branches are also unused pad markers':'CPU strobes retain full-depth native branches'}. ${commandPadStarts?'All 52 command descriptors are exact actual top-pad markers and contain no new manufactured copper':`CPU command top tips remain; RAM command ${pruneRamCommand?'retains only unused top tips, with no reserved manufactured holes':'full-depth branches remain reserved'}`}. No new channel or physical qualification is claimed.`}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,exactPadStarts:actualPads.length,nativeThroughBranches}))
