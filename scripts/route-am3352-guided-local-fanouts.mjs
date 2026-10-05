import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'
import {assertRetainedPhaseCopper} from './lib/am3352-retained-phase-copper.mjs'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenCpuTails} from './lib/am3352-open-cpu-tails.mjs'
import {assertOpenCommandPrefixes} from './lib/am3352-open-command-prefixes.mjs'

// Native bus_lanes supplies the actual pad dogbones. A local, conservative
// grid search authors the short escape modifications; native bus_lanes still
// routes and matches the intervening channel. Neither inner plane is used for
// a signal. This diagnostic is never a fabrication approval.
const bootstrap=process.argv[2]??'dist/am3352-four-layer-ram-bypass-reserved-attempt-38'
const directory=process.argv[3]??'dist/am3352-guided-byte0-attempt-39'
const busName=process.argv[4]??'DDR_BYTE0'
const seconds=Number(process.argv[5]??60)
const ramOrder=process.argv[6]??'same'
const ramFirst=process.argv[7]==='ram-first'
const pairExitX=Number(process.argv[8]??4.08)
const lanePitch=Number(process.argv[9]??.32)
const localMaxX=Number(process.argv[10]??9)
const freeDq=process.argv[11]==='free-dq'
const handoffBaseX=Number(process.argv[12]??2.8)
const localGridStep=Number(process.argv[13]??.02)
const prioritySignal=process.argv[14]
const reversePair=process.argv[15]==='reverse-pair'
assert(process.argv[15]===undefined||reversePair||process.argv[15]==='normal-pair')
const dmExitX=process.argv[16]===undefined||process.argv[16]==='none'?undefined:Number(process.argv[16])
assert(dmExitX===undefined||Number.isFinite(dmExitX)&&Math.abs(dmExitX)<=17)
const cpuLocalMaxY=Number(process.argv[17]??-3.8);assert(cpuLocalMaxY>=-3.8&&cpuLocalMaxY<=9.5)
const localOnly=process.argv[18]==='local-only'
assert(process.argv[18]===undefined||localOnly)
const localViaCost=Number(process.argv[19]??8);assert(localViaCost>=.5&&localViaCost<=8)
const forceNativeRamVias=process.argv[20]==='force-native-ram-vias'
assert(process.argv[20]===undefined||forceNativeRamVias||process.argv[20]==='allow-native-ram-top')
const ramLocalMinY=Number(process.argv[21]??-35);assert(ramLocalMinY>=-38.5&&ramLocalMinY<=-35)
const sideHandoffs=process.argv[22]==='left-side-handoffs'
assert(process.argv[22]===undefined||sideHandoffs||process.argv[22]==='facing-handoffs')
assert(!sideHandoffs||['DDR_COMMAND_CLOCK','DDR_RESET'].includes(busName)&&!freeDq)
const sidePairBaseY=Number(process.argv[23]??-28);assert(sidePairBaseY>=-35&&sidePairBaseY<=-22)
const sideCpuX=Number(process.argv[24]??-9);assert(sideCpuX>=-17&&sideCpuX<=-9)
const reusePackageDirectory=process.argv[25]==='none'?undefined:process.argv[25]
assert(!reusePackageDirectory||!freeDq||ramFirst,'Free DQ reuse must keep the first RAM package fixed until source rebind')
const maximumLocalVias=Number(process.argv[26]??2);assert(Number.isInteger(maximumLocalVias)&&maximumLocalVias>=2&&maximumLocalVias<=6)
const keepPairFirst=process.argv[27]==='keep-pair-first'
assert(process.argv[27]===undefined||keepPairFirst||process.argv[27]==='allow-pair-reordering')
const ramExitY=Number(process.argv[28]??-18)
assert(ramExitY>=-38&&ramExitY<=-18&&(!sideHandoffs||ramExitY===-18))
const maximumLocalReplans=Number(process.argv[29]??12)
assert(Number.isInteger(maximumLocalReplans)&&maximumLocalReplans>=12&&maximumLocalReplans<=64)
const seedOrderDirectory=process.argv[30]==='none'?undefined:process.argv[30];assert(!seedOrderDirectory||reusePackageDirectory)
const cpuLocalMinY=Number(process.argv[31]??-10.5);assert(cpuLocalMinY>=-17&&cpuLocalMinY<=-10.5)
const ramLocalMinX=process.argv[32]===undefined?undefined:Number(process.argv[32])
assert(ramLocalMinX===undefined||ramLocalMinX>=-17.5&&ramLocalMinX<=-9)
const viaPlacementGrid=Number(process.argv[33]??.2);assert([.02,.04,.2].includes(viaPlacementGrid))
const forceNativeCpuVias=process.argv[34]==='force-native-cpu-vias'
assert(process.argv[34]===undefined||forceNativeCpuVias||process.argv[34]==='allow-native-cpu-top')
const forceNativeCpuPairVias=process.argv[35]==='force-native-cpu-pair-vias'
assert(process.argv[35]===undefined||forceNativeCpuPairVias||process.argv[35]==='allow-native-cpu-pair-top')
const cpuPairViaHandoffCorridor=process.argv[36]==='cpu-pair-via-handoff-corridor'
assert(process.argv[36]===undefined||cpuPairViaHandoffCorridor||process.argv[36]==='allow-free-cpu-pair-returns')
const cpuExitY=Number(process.argv[37]??-10.5)
assert(cpuExitY>=cpuLocalMinY&&cpuExitY<=-10.5)
assert(!cpuPairViaHandoffCorridor||forceNativeCpuPairVias&&busName==='DDR_BYTE1')
assert([.01,.02].includes(localGridStep))
assert(handoffBaseX>=-17&&handoffBaseX<=16)
assert(lanePitch>=.32&&lanePitch<=1.6&&localMaxX>=9&&localMaxX<=17.5)
const original=JSON.parse(readFileSync(`${bootstrap}/input.simple-route.json`))
const native=JSON.parse(readFileSync(`${bootstrap}/signal-escapes.native.json`))
const bootstrapReport=JSON.parse(readFileSync(`${bootstrap}/result.json`))
const sideCpuYOffset=Number(process.env.AM3352_CPU_SIDE_HANDOFF_Y_OFFSET??26)
assert(Number.isFinite(sideCpuYOffset)&&sideCpuYOffset>=18&&sideCpuYOffset<=26)
if(sideCpuYOffset!==26){
  assert(sideHandoffs)
  assert.equal(bootstrapReport.manualPartialCommandSelection?.selectedChannels,1)
  const {summary}=readCheckedCommandSummary(bootstrapReport.checkedSourceSummary)
  assert.deepEqual(summary.source,bootstrapReport.source)
}
if(viaPlacementGrid===.02){
  assert(bootstrapReport.manualPartialCommandSelection?.selectedChannels===1||['DDR_D10','DDR_D14'].includes(bootstrapReport.cpuPrefixRebuild?.name))
  const {summary}=readCheckedCommandSummary(bootstrapReport.checkedSourceSummary)
  assert.deepEqual(summary.source,bootstrapReport.source)
}
// A single new command need not use vertically aligned package handoffs.
// This only changes manual search targets; all fixed source copper and
// manufacturing constraints remain obstacles to both fanout and native phases.
let independentCpuHandoff
if(process.env.AM3352_SINGLE_COMMAND_CPU_HANDOFF){
  assert(ramFirst&&busName==='DDR_COMMAND_CLOCK')
  assert.equal(bootstrapReport.manualPartialCommandSelection?.selectedChannels,1)
  const {summary}=readCheckedCommandSummary(bootstrapReport.checkedSourceSummary)
  assert.deepEqual(summary.source,bootstrapReport.source)
  const coordinates=process.env.AM3352_SINGLE_COMMAND_CPU_HANDOFF.split(',').map(Number)
  assert.equal(coordinates.length,2);assert(coordinates.every(Number.isFinite))
  const [x,y]=coordinates
  assert(x>=-17.5&&x<=localMaxX&&y>=cpuLocalMinY&&y<=cpuLocalMaxY)
  independentCpuHandoff={x,y}
}
const sourceTraceCount=bootstrapReport.sourceCopper.totalSourceTraces??bootstrapReport.sourceCopper.traces
const cpuPrefixOnly=process.env.AM3352_CPU_PREFIX_ONLY==='1'
if(cpuPrefixOnly){
  assert(!ramFirst&&!sideHandoffs&&busName==='DDR_CPU_PREFIX_REBUILD')
  assert(['DDR_D10','DDR_D14'].includes(bootstrapReport.cpuPrefixRebuild?.name))
  assert.equal(bootstrapReport.cpuPrefixRebuild.sourceTraceId,bootstrapReport.cpuPrefixRebuild.name==='DDR_D10'?'source_trace_11':'source_trace_40')
  assert.equal(bootstrapReport.exportable,false)
}
assert(!bootstrapReport.cpuPrefixRebuild||cpuPrefixOnly)
const firstPackageOnly=process.env.AM3352_RAM_ONLY==='1'
assert(!firstPackageOnly||ramFirst&&bootstrapReport.checkedCpuChannelReuse)
const layeredRamHandoffs=process.env.AM3352_LAYERED_RAM_HANDOFFS==='1'
assert(!layeredRamHandoffs||firstPackageOnly&&busName==='DDR_RAM_ACCESS'&&bootstrapReport.layeredRamHandoffsRequired)
const ramLocalMaxY=Number(process.env.AM3352_RAM_LOCAL_MAX_Y??-18)
assert(ramLocalMaxY===-18||layeredRamHandoffs&&ramLocalMaxY>=-18&&ramLocalMaxY<=-16)
let independentRamHandoff
if(process.env.AM3352_SINGLE_COMMAND_RAM_HANDOFF){
  assert(ramFirst&&independentCpuHandoff&&busName==='DDR_COMMAND_CLOCK')
  assert.equal(bootstrapReport.manualPartialCommandSelection?.selectedChannels,1)
  const coordinates=process.env.AM3352_SINGLE_COMMAND_RAM_HANDOFF.split(',').map(Number)
  assert.equal(coordinates.length,2);assert(coordinates.every(Number.isFinite))
  const [x,y]=coordinates
  assert(x>=(ramLocalMinX??-9)&&x<=localMaxX&&y>=ramLocalMinY&&y<=ramLocalMaxY)
  independentRamHandoff={x,y}
}
let retainedStagedCkeTraceCount=0,retainedStagedCkeTrace
if(bootstrapReport.retainedStagedCkeCopper){
  assert(layeredRamHandoffs)
  const a=bootstrapReport.retainedStagedCkeCopper
  for(const p of [a,a.nativeChannelRun])assert.equal(createHash('sha256').update(readFileSync(p.path)).digest('hex'),p.sha256)
  assert.equal(a.tracePieces,1);assert.equal(a.throughVias,4);assert.equal(a.accepted,false)
  retainedStagedCkeTrace=JSON.parse(readFileSync(a.path))
  assert.equal(retainedStagedCkeTrace.source_trace_id,'source_trace_48')
  assert.deepEqual(original.traces.find(t=>t.pcb_trace_id===retainedStagedCkeTrace.pcb_trace_id),retainedStagedCkeTrace)
  retainedStagedCkeTraceCount=1
}
const stagedRamOnly=process.env.AM3352_STAGE_RAM_ONLY==='1'
assert(!stagedRamOnly||ramFirst&&!firstPackageOnly&&bootstrapReport.temporaryOpenRamTails?.stagedRepairOnly)
if(bootstrapReport.temporaryOpenRamTails){
  const a=bootstrapReport.temporaryOpenRamTails
  assert.equal(createHash('sha256').update(readFileSync(a.path)).digest('hex'),a.sha256)
  assert.deepEqual(a.originalSource,bootstrapReport.source)
  const tails=JSON.parse(readFileSync(a.path)),source=readRoutingSourceSnapshot(bootstrapReport.source).circuit
  assert.equal(tails.length,3)
  const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
  for(const t of tails){
    assert.deepEqual(geometry(source.find(e=>e.type==='pcb_trace'&&e.source_trace_id===t.sourceTraceId).route),geometry(t.originalRoute))
    assert.deepEqual(original.traces.find(e=>e.source_trace_id===t.sourceTraceId).route,t.retainedPrefix)
    assert.deepEqual(t.retainedPrefix,t.originalRoute.slice(0,t.retainedPrefix.length))
    assert(Math.abs(t.retainedPrefix.at(-1).y+18)<1e-8)
  }
  for(const t of original.traces){
    const expected=t.pcb_trace_id===retainedStagedCkeTrace?.pcb_trace_id?retainedStagedCkeTrace.route:tails.find(p=>p.sourceTraceId===t.source_trace_id)?.retainedPrefix??source.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===t.pcb_trace_id)?.route
    assert(expected);assert.deepEqual(geometry(t.route),geometry(expected))
    for(const p of t.route.filter(p=>p.route_type==='via')){
      const v=source.find(e=>e.type==='pcb_via'&&Math.hypot(e.x-p.x,e.y-p.y)<1e-8)
      if(v){assert.equal(p.via_diameter,v.outer_diameter);assert.equal(p.via_hole_diameter,v.hole_diameter);assert.deepEqual(new Set(p.layers),new Set(v.layers))}
      else{assert.equal(t.pcb_trace_id,retainedStagedCkeTrace?.pcb_trace_id);assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254);assert.deepEqual(new Set(p.layers),new Set(['top','inner1','inner2','bottom']))}
    }
  }
}
const retainedPhaseTraceCount=assertRetainedPhaseCopper(bootstrapReport,original)+retainedStagedCkeTraceCount
const preliminarySource=readRoutingSourceSnapshot(bootstrapReport.source).circuit
const temporarilyOpenCpuTails=assertOpenCpuTails(bootstrapReport,cpuPrefixOnly?{...original,traces:original.traces.slice(0,129)}:original,preliminarySource)
const temporarilyOpenCommandPrefixes=assertOpenCommandPrefixes(bootstrapReport,original,preliminarySource)
const pendingCpuTailRepairs=temporarilyOpenCpuTails.filter(t=>!bootstrapReport.restoredCpuPrefixNames?.includes(t.name)).length
if(cpuPrefixOnly){
  const a=bootstrapReport.stagedFixedCopper
  assert.equal(createHash('sha256').update(readFileSync(a.path)).digest('hex'),a.sha256)
  assert.deepEqual(original.traces.slice(129),JSON.parse(readFileSync(a.path)))
  assert.equal(original.traces.length,129+JSON.parse(readFileSync(a.path)).length)
  assert([132,133].includes(original.traces.length))
  for(const a of [bootstrapReport.cpuPrefixRebuild.nativeD14Run,bootstrapReport.cpuPrefixRebuild.nativeD14Prefix,bootstrapReport.cpuPrefixRebuild.stagedNativeCommand].filter(Boolean))assert.equal(createHash('sha256').update(readFileSync(a.path)).digest('hex'),a.sha256)
}
const actualPadCount=preliminarySource.filter(e=>e.type==='pcb_smtpad').length
assert.equal(original.layerCount,4);assert.equal(original.traces.length,sourceTraceCount+retainedPhaseTraceCount)
assert.equal(original.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,actualPadCount)
assert.equal(native.length,bootstrapReport.preparedLocalEscapes);assert.equal(original.allowBlindAndBuriedVias,false)
const bus=original.buses.find(b=>b.name===busName);assert(bus)
assert(['top','bottom'].includes(bus.allowedLayers[0]))
const channelLayer=bus.allowedLayers[0],goalLayerIndex=channelLayer==='bottom'?0:1
mkdirSync(directory,{recursive:true})
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const names=new Set(bus.connectionNames),connections=original.connections.filter(c=>names.has(c.name))
// Native top-layer preparation needs no layer-change dogbones. In that
// case manual local edits begin at the unchanged exact package terminals.
// These single-point descriptors are not new copper or manufactured holes.
let exactPadStarts=0
const terminalEscapes=connections.flatMap(c=>c.pointsToConnect.map((p,i)=>{
  const escape=native.find(t=>t.pcb_trace_id===`local_dogbone_${c.name}_${i}`)
  if(escape)return escape
  assert.equal(p.layer,'top')
  assert(channelLayer==='top'||bootstrapReport.actualPackagePadStartsAllowed&&bootstrapReport.allChannelEndpointsActualTopPads)
  const actual=preliminarySource.find(e=>e.type==='pcb_port'&&e.pcb_port_id===p.pcb_port_id)
  if(channelLayer==='bottom')assert(actual&&Math.hypot(actual.x-p.x,actual.y-p.y)<1e-8&&actual.layers.includes('top'))
  exactPadStarts++
  return {pcb_trace_id:`local_dogbone_${c.name}_${i}`,source_trace_id:c.name,
    connection_name:c.name,route:[{route_type:'wire',x:p.x,y:p.y,layer:'top',width:.1016}]}
}))
const freeDqNames=new Set(preliminarySource.filter(e=>e.type==='source_trace'&&/^DDR_D\d+$/.test(e.name)&&names.has(e.source_trace_id)).map(e=>e.source_trace_id))
assert(!freeDq||freeDqNames.size===8)
const pair=original.differentialPairs.find(p=>p.connectionNames.every(n=>names.has(n)))
assert(pair||['DDR_RESET','DDR_COMMAND_CLOCK'].includes(busName)||layeredRamHandoffs||cpuPrefixOnly)
const wideSideHandoffs=process.env.AM3352_SIDE_HANDOFF_WIDE==='1'
assert(!wideSideHandoffs||sideHandoffs&&busName==='DDR_COMMAND_CLOCK'&&!pair&&connections.length===24)
const sideRamHandoffBaseY=wideSideHandoffs?-38:-35.4
const sideRamHandoffSlots=wideSideHandoffs?Math.floor((-18-sideRamHandoffBaseY)/lanePitch)+1:Math.max(16,connections.length+12)
const pairHandoffs=new Map((pair?.connectionNames??[]).map((n,i)=>[n,sideHandoffs?
  {x:-9,y:sidePairBaseY+(reversePair?1-i:i)*.32}:{x:pairExitX+(reversePair?1-i:i)*.32}]))
const fixedHandoffs=new Map(pairHandoffs)
if(cpuPrefixOnly)fixedHandoffs.set(bootstrapReport.cpuPrefixRebuild.sourceTraceId,bootstrapReport.cpuPrefixRebuild.target)
if(layeredRamHandoffs){
  assert.deepEqual(new Set(connections.map(c=>c.name)),new Set(['source_trace_27','source_trace_31','source_trace_32']))
  const a=bootstrapReport.checkedCpuChannelReuse
  assert.equal(createHash('sha256').update(readFileSync(a.sections.path)).digest('hex'),a.sections.sha256)
  for(const p of a.handoffs){
    const t=original.traces.find(t=>t.source_trace_id===p.sourceTraceId);assert.deepEqual(t.route.at(-1),Object.fromEntries(Object.entries(p).filter(([k])=>k!=='sourceTraceId')))
    assert.equal(p.y,-18);assert(['top','bottom'].includes(p.layer));fixedHandoffs.set(p.sourceTraceId,{x:p.x,y:p.y,layer:p.layer})
  }
  assert.equal(fixedHandoffs.size,3)
}
if(dmExitX!==undefined){
 const dm=preliminarySource.find(e=>e.type==='source_trace'&&e.name===`DDR_DQM${busName==='DDR_BYTE1'?1:0}`)
 assert(dm&&names.has(dm.source_trace_id));fixedHandoffs.set(dm.source_trace_id,{x:dmExitX})
}
const ownerIds=new Map(original.connections.map((c,i)=>[c.name,i+1]))
const report={status:'LOCAL_MODIFICATIONS_IN_PROGRESS',bus:busName,source:JSON.parse(readFileSync(`${bootstrap}/result.json`)).source,
  checkedSourceSummary:bootstrapReport.checkedSourceSummary,manualPartialCommandSelection:bootstrapReport.manualPartialCommandSelection,
  independentCpuHandoff,
  independentRamHandoff,
  cpuPrefixRebuild:bootstrapReport.cpuPrefixRebuild,stagedFixedCopper:bootstrapReport.stagedFixedCopper,
  restoredCpuPrefixNames:bootstrapReport.restoredCpuPrefixNames,
  ...(temporarilyOpenCpuTails.length?{temporaryOpenCpuTails:bootstrapReport.temporaryOpenCpuTails,pendingCpuTailRepairs,stagedPreviouslyConnectedSignals:readCheckedCommandSummary(bootstrapReport.checkedSourceSummary).registration.signals-pendingCpuTailRepairs,exportable:false}:{}),
  ...(temporarilyOpenCommandPrefixes.length?{temporaryOpenCommandPrefixes:bootstrapReport.temporaryOpenCommandPrefixes,pendingCommandPrefixRepairs:temporarilyOpenCommandPrefixes.length,stagedPreviouslyConnectedSignals:readCheckedCommandSummary(bootstrapReport.checkedSourceSummary).registration.signals-temporarilyOpenCommandPrefixes.length,exportable:false}:{}),
  memoryMap:bootstrapReport.memoryMap,ramReferenceLayout:bootstrapReport.ramReferenceLayout,preservedSavedDdr:bootstrapReport.preservedSavedDdr,
  checkedCpuChannelReuse:bootstrapReport.checkedCpuChannelReuse,firstPackageOnly,
  stagedRamOnly,temporaryOpenRamTails:bootstrapReport.temporaryOpenRamTails,
  layeredRamHandoffs,retainedStagedCkeCopper:bootstrapReport.retainedStagedCkeCopper,
  ramLocalMaximumYMm:ramLocalMaxY,
  manualRamEscape:bootstrapReport.manualRamEscape,
  manualNativeEscapeCorrection:bootstrapReport.manualNativeEscapeCorrection,
  manualUnusedBranchPruning:bootstrapReport.manualUnusedBranchPruning,
  manualUnusedBranchPruningHistory:bootstrapReport.manualUnusedBranchPruningHistory,
  manualCpuDogboneCorrection:bootstrapReport.manualCpuDogboneCorrection,
  temporaryOpenSignals:bootstrapReport.temporaryOpenSignals,
  temporaryOpenCommandChannels:bootstrapReport.temporaryOpenCommandChannels,
  nativeBootstrap:{path:`${bootstrap}/signal-escapes.native.json`,sha256:hash(`${bootstrap}/signal-escapes.native.json`),dogbones:native.length},
  ...(exactPadStarts?{manualLocalStart:'Exact top-layer numeric package pads',manualExactPadStartCount:exactPadStarts}:{}),
  nativeRamOnlyPreparation:bootstrapReport.nativeRamOnlyPreparation,
  nativeCpuOnlyPreparation:bootstrapReport.nativeCpuOnlyPreparation,
  retainedPhaseCopper:bootstrapReport.retainedPhaseCopper,
  manualRamNativeTipCorrection:bootstrapReport.manualRamNativeTipCorrection,
  manualCpuPadStartCorrection:bootstrapReport.manualCpuPadStartCorrection,
  manualRamMaskPadStartCorrection:bootstrapReport.manualRamMaskPadStartCorrection,
  manualByte1AfterByte0Correction:bootstrapReport.manualByte1AfterByte0Correction,
  manualCpuStrobeViaRestoration:bootstrapReport.manualCpuStrobeViaRestoration,
  manualChannelLayerAllocation:bootstrapReport.manualChannelLayerAllocation,
  solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',localModificationGridMm:localGridStep,lanePitchMm:lanePitch,localMaximumXMm:localMaxX,handoffBaseXMm:handoffBaseX,
  fourCopperLayers:true,signalLayers:['top','bottom'],sourceTracesRetained:sourceTraceCount,actualPadObstacles:actualPadCount,
  channelLayer,
  pairHandoffOrder:reversePair?'negative-left-positive-right':'positive-left-negative-right',
  ...(dmExitX===undefined?{}:{dmHandoffXMm:dmExitX}),
  cpuLocalMaximumYMm:cpuLocalMaxY,wireSamplingGuardMm:localGridStep*.725,viaPointPaddingMm:1e-9,
  localViaSearchPenaltyMm:localViaCost,
  localViaPlacementGridMm:viaPlacementGrid,
  maximumLocalVias,keepPairFirst,
  ramLocalHandoffYMm:ramExitY,
  maximumLocalReplans,
  cpuLocalMinimumYMm:cpuLocalMinY,
  cpuLocalHandoffYMm:cpuExitY,
  ...(ramLocalMinX===undefined?{}:{ramLocalMinimumXMm:ramLocalMinX}),
  forceNativeRamVias,forceNativeCpuVias,forceNativeCpuPairVias,cpuPairViaHandoffCorridor,ramLocalMinimumYMm:ramLocalMinY,
  ...(sideHandoffs?{handoffOrientation:'left-side',sideHandoffXMm:-9,cpuSideHandoffXMm:sideCpuX,ramHandoffBaseYMm:sideRamHandoffBaseY,sideRamHandoffSlots,cpuHandoffYOffsetMm:sideCpuYOffset,wideSideHandoffs}:{}),
  localEscapes:[],completedSignals:0,requiredSignals:49,fabricationReady:false,
  timingQualified:false,returnPlaneChangesQualified:false,freeDqExitPermutation:freeDq}
const save=()=>writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
const width=.1016,clearance=.1016,guard=localGridStep*.725,land=.4572,drill=.254
const layers=['bottom','top'],step=localGridStep
const wire=(x,y,layer)=>({route_type:'wire',x,y,layer,width})
const via=(x,y,from_layer,to_layer)=>({route_type:'via',x,y,from_layer,to_layer,
  layers:['top','inner1','inner2','bottom'],via_diameter:land,via_hole_diameter:drill})
const ownerOf=o=>o.connectedTo?.map(n=>ownerIds.get(n)).find(Boolean)??500
const sourceTraceNames=new Map(preliminarySource.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name]))
const shapes=[]
for(const o of original.obstacles){
  const ls=o.layers.filter(l=>layers.includes(l));if(!ls.length)continue
  const s={owner:ownerOf(o),layers:ls,pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,
    x:o.center.x,y:o.center.y,kind:o.shape==='circle'?'circle':'rect',w:o.width,h:o.height,
    origin:{kind:'obstacle',pcb_smtpad_id:o.circuitJsonMetadata?.pcb_smtpad_id,pcb_port_id:o.circuitJsonMetadata?.pcb_port_id,
      pcb_via_id:o.circuitJsonMetadata?.pcb_via_id,pcb_trace_id:o.circuitJsonMetadata?.pcb_trace_id}}
  shapes.push(s)
}
const appendTrace=t=>{
  const owner=ownerIds.get(t.source_trace_id??t.connection_name)??500
  const origin={kind:'route',pcb_trace_id:t.pcb_trace_id,source_trace_id:t.source_trace_id??t.connection_name,name:sourceTraceNames.get(t.source_trace_id??t.connection_name)}
  for(let i=0;i<t.route.length;i++){
    const p=t.route[i]
    if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,
      hole:p.via_hole_diameter,owner,layers,origin})
    if(i){const a=t.route[i-1],b=p
      if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8&&!(a.route_type==='wire'&&b.route_type==='wire'&&a.layer!==b.layer))
        shapes.push({kind:'segment',a,b,w:Math.max(a.width??width,b.width??width),owner,
          layers:[a.route_type==='wire'?a.layer:b.layer],origin})
    }
  }
}
original.traces.forEach(appendTrace);native.forEach(appendTrace)
// Physical source vias also occur as pad-like converter obstacles. Their
// hole checks must be retained, even for same-net new holes.
const snapshot=readRoutingSourceSnapshot(report.source),source=snapshot.circuit
report.sourceSnapshot=snapshot.source
for(const v of source.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,
  w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,owner:layeredRamHandoffs?(ownerIds.get(source.find(t=>t.type==='pcb_trace'&&t.pcb_trace_id===v.pcb_trace_id)?.source_trace_id)??500):500,layers,
  origin:{kind:'physical-via',pcb_via_id:v.pcb_via_id,pcb_trace_id:v.pcb_trace_id,name:sourceTraceNames.get(source.find(t=>t.type==='pcb_trace'&&t.pcb_trace_id===v.pcb_trace_id)?.source_trace_id)}})
const pointDistance=(s,x,y)=>{
  if(s.kind==='circle')return Math.hypot(x-s.x,y-s.y)-s.w/2
  if(s.kind==='rect')return Math.hypot(Math.max(0,Math.abs(x-s.x)-s.w/2),Math.max(0,Math.abs(y-s.y)-s.h/2))
  const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y
  const f=Math.max(0,Math.min(1,((x-s.a.x)*dx+(y-s.a.y)*dy)/(dx*dx+dy*dy)))
  return Math.hypot(x-s.a.x-f*dx,y-s.a.y-f*dy)-s.w/2
}
class Heap {
  a=[]
  push(id,f,g){const a=this.a,v={id,f,g};let i=a.length;a.push(v);while(i){let p=(i-1)>>1;if(a[p].f<=f)break;a[i]=a[p];i=p}a[i]=v}
  pop(){const a=this.a,v=a[0],last=a.pop();if(a.length){let i=0;while(true){let c=2*i+1;if(c>=a.length)break;if(c+1<a.length&&a[c+1].f<a[c].f)c++;if(a[c].f>=last.f)break;a[i]=a[c];i=c}a[i]=last}return v}
}
function localRoute(start,targets,bounds,name,existingViaAtStart,desiredLayer=channelLayer){
  const goalLayerIndex=layers.indexOf(desiredLayer);assert(goalLayerIndex>=0)
  assert(start.x>=bounds.minX-1e-6&&start.x<=bounds.maxX+1e-6&&start.y>=bounds.minY-1e-6&&start.y<=bounds.maxY+1e-6,'Exact native start must lie inside the physical search bounds')
  const nx=Math.round((bounds.maxX-bounds.minX)/step)+1,ny=Math.round((bounds.maxY-bounds.minY)/step)+1,N=nx*ny
  const xy=i=>({x:bounds.minX+(i%nx)*step,y:bounds.minY+Math.floor(i/nx)*step})
  const index=p=>Math.round((p.x-bounds.minX)/step)+nx*Math.round((p.y-bounds.minY)/step)
  const owner=ownerIds.get(name),blocked=[new Uint8Array(N),new Uint8Array(N)],viaBlocked=new Uint8Array(N)
  for(const s of shapes){
    const r=land/2+clearance+guard+(s.kind==='segment'?s.w/2:0)
    const sx=s.kind==='segment'?Math.min(s.a.x,s.b.x):s.x-s.w/2,ex=s.kind==='segment'?Math.max(s.a.x,s.b.x):s.x+s.w/2
    const sy=s.kind==='segment'?Math.min(s.a.y,s.b.y):s.y-s.h/2,ey=s.kind==='segment'?Math.max(s.a.y,s.b.y):s.y+s.h/2
    const x0=Math.max(0,Math.floor((sx-r-bounds.minX)/step)),x1=Math.min(nx-1,Math.ceil((ex+r-bounds.minX)/step))
    const y0=Math.max(0,Math.floor((sy-r-bounds.minY)/step)),y1=Math.min(ny-1,Math.ceil((ey+r-bounds.minY)/step))
    if(x1<x0||y1<y0)continue
    for(let iy=y0;iy<=y1;iy++)for(let ix=x0;ix<=x1;ix++){
      const i=ix+iy*nx,x=bounds.minX+ix*step,y=bounds.minY+iy*step,d=pointDistance(s,x,y)
      // Own existing copper is connectable. All other copper retains its
      // full width plus clearance. Guard covers the half-cell diagonal.
      if(s.owner!==owner&&d<width/2+clearance+guard)for(const l of s.layers){
        const layerIndex=layers.indexOf(l)
        if(layerIndex>=0)blocked[layerIndex][i]=1
      }
      // A via is placed at this exact grid point, with no interpolated
      // edge. The half-cell guard belongs to sampled wire segments only;
      // applying it to a hole rejects legal 18/10mil BGA interstices.
      if((s.owner!==owner&&d<land/2+clearance+1e-9)||(s.pad&&d<drill/2+.2+1e-9)||
        (s.hole&&Math.hypot(x-s.x,y-s.y)<drill/2+s.hole/2+.254+1e-9))viaBlocked[i]=1
    }
  }
  const startI=index(start),goalMap=new Map(targets.map(p=>[index(p),p]))
  const goals=[...goalMap.keys()].filter(i=>!blocked[goalLayerIndex][i]);if(!goals.length)return {error:'all handoffs obstructed'}
  const heuristic=i=>{const p=xy(i);return Math.min(...goals.map(g=>{const q=xy(g);return Math.hypot(p.x-q.x,p.y-q.y)}))}
  const distances=new Float32Array(N*2*(maximumLocalVias+1));distances.fill(Infinity)
  const parents=new Int32Array(N*2*(maximumLocalVias+1));parents.fill(-1)
  const heap=new Heap(),initialLayer=layers.indexOf(start.layer);assert(initialLayer>=0)
  if(!blocked[initialLayer][startI]){distances[initialLayer*N+startI]=0;heap.push(initialLayer*N+startI,heuristic(startI),0)}
  // A saved full-depth bootstrap via is already present at the start. Its
  // top land is also a legal starting point; reuse that physical hole instead
  // of creating a redundant coincident drill to access the other outer layer.
  const forceNativeVia=forceNativeRamVias&&start.y<-15||start.y>-15&&(forceNativeCpuVias||forceNativeCpuPairVias&&pair?.connectionNames.includes(name))
  if(existingViaAtStart&&!forceNativeVia&&!blocked[1-initialLayer][startI]){distances[(1-initialLayer)*N+startI]=0;heap.push((1-initialLayer)*N+startI,heuristic(startI),0)}
  let expanded=0,finish=-1;const begun=performance.now()
  while(heap.a.length){
    const item=heap.pop(),id=item.id;if(Math.abs(item.g-distances[id])>1e-5)continue
    const count=Math.floor(id/N),i=id%N,l=count%2,viaCount=Math.floor(count/2),ix=i%nx,iy=Math.floor(i/nx)
    if(l===goalLayerIndex&&goalMap.has(i)){finish=id;break}
    if(++expanded%50000===0&&performance.now()-begun>seconds*1000)return {error:'local timeout',expanded}
    const relax=(next,cost)=>{const g=item.g+cost;if(g+1e-6<distances[next]){
      distances[next]=g;parents[next]=id;heap.push(next,g+heuristic(next%N),g)}}
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      if(ix+dx<0||ix+dx>=nx||iy+dy<0||iy+dy>=ny)continue
      const next=i+dx+dy*nx;if(!blocked[l][next])relax(count*N+next,step*(dx&&dy?Math.SQRT2:1))
    }
    // Additional full-depth vias use the recorded placement grid,
    // to the recorded per-path maximum, and never inside a pad.
    const p=xy(i),site=Math.abs(p.x/viaPlacementGrid-Math.round(p.x/viaPlacementGrid))<1e-6&&Math.abs(p.y/viaPlacementGrid-Math.round(p.y/viaPlacementGrid))<1e-6
    // For the CPU strobe pair only, keep the return via above its own
    // handoff column. An early TOP return can fence off neighboring exits.
    // This adds a placement restriction; all existing clearance/hole tests
    // still apply and no guide is removed from the search.
    const pairReturnAllowed=!cpuPairViaHandoffCorridor||start.y<-15||!pair?.connectionNames.includes(name)||
      targets.some(t=>Math.abs(p.x-t.x)<=.020000001)&&p.y>=-9-1e-6&&p.y<=-7.6+1e-6
    if(viaCount<maximumLocalVias&&site&&pairReturnAllowed&&!viaBlocked[i]&&!blocked[1-l][i])relax(((viaCount+1)*2+1-l)*N+i,localViaCost)
  }
  if(finish<0){
    const ls=new Set(),r={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity}
    const visited=[new Uint8Array(N),new Uint8Array(N)]
    for(let id=0;id<distances.length;id++)if(Number.isFinite(distances[id])){
      const p=xy(id%N);ls.add(layers[Math.floor(id/N)%2]);r.minX=Math.min(r.minX,p.x);r.maxX=Math.max(r.maxX,p.x);r.minY=Math.min(r.minY,p.y);r.maxY=Math.max(r.maxY,p.y)
      visited[Math.floor(id/N)%2][id%N]=1
    }
    const counts=new Map(),samples=new Set()
    for(let l=0;l<2;l++)for(let i=0;i<N;i++)if(visited[l][i]){
      const ix=i%nx,iy=Math.floor(i/nx)
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        if(ix+dx<0||ix+dx>=nx||iy+dy<0||iy+dy>=ny)continue
        const next=i+dx+dy*nx;if(!blocked[l][next])continue
        const p=xy(next),key=`${l},${Math.round(p.x/.08)},${Math.round(p.y/.08)}`
        if(samples.has(key))continue;samples.add(key)
        for(const s of shapes)if(s.origin&&s.owner!==owner&&s.layers.includes(layers[l])&&pointDistance(s,p.x,p.y)<width/2+clearance+guard){
          const label=s.origin.name??s.origin.pcb_trace_id??s.origin.pcb_smtpad_id??s.origin.pcb_via_id??JSON.stringify(s.origin)
          const record=counts.get(label)??{origin:s.origin,boundarySamples:0,layers:new Set()};record.boundarySamples++;record.layers.add(layers[l]);counts.set(label,record)
        }
      }
    }
    const boundaryBlockers=[...counts.values()].sort((a,b)=>b.boundarySamples-a.boundarySamples).slice(0,24).map(b=>({...b,layers:[...b.layers]}))
    const reachableTargetColumns=[]
    for(const x of [...new Set(targets.map(p=>p.x))])for(let l=0;l<2;l++){
      const ix=Math.round((x-bounds.minX)/step),spans=[]
      if(ix<0||ix>=nx)continue
      for(let iy=0;iy<ny;iy++)if(visited[l][ix+iy*nx]){
        const y=bounds.minY+iy*step,last=spans.at(-1)
        if(last&&Math.abs(y-last.maxY-step)<1e-8)last.maxY=y
        else spans.push({minY:y,maxY:y})
      }
      if(spans.length)reachableTargetColumns.push({x,layer:layers[l],spans})
    }
    return {error:'no clearance-preserving local path',expanded,reachableLayers:[...ls],reachableBounds:ls.size?r:null,reachableTargetColumns,boundaryBlockers,
      blockerScope:'Diagnostic reachable-boundary contacts only; fixed copper and all clearance rules are unchanged.'}
  }
  const ids=[];for(let id=finish;id>=0;id=parents[id])ids.push(id);ids.reverse()
  const route=[]
  for(let k=0;k<ids.length;k++){
    const id=ids[k],p=xy(id%N),l=layers[Math.floor(id/N)%2]
    if(k&&Math.floor(ids[k-1]/N)!==Math.floor(id/N))route.push(via(p.x,p.y,layers[Math.floor(ids[k-1]/N)%2],l))
    const prev=k?xy(ids[k-1]%N):null,next=k+1<ids.length?xy(ids[k+1]%N):null
    if(!prev||!next||Math.floor(ids[k-1]/N)!==Math.floor(id/N)||Math.floor(ids[k+1]/N)!==Math.floor(id/N)||
      Math.abs((p.x-prev.x)*(next.y-p.y)-(p.y-prev.y)*(next.x-p.x))>1e-8)route.push(wire(p.x,p.y,l))
  }
  const newVias=route.filter(p=>p.route_type==='via').length
  return {route,end:xy(finish%N),expanded,newVias,reusedBootstrapLayer:route[0].layer,length:distances[finish]-localViaCost*newVias}
}
const handoffs=new Map(),modified=[]
const secondHandoffs=new Map()
if(reusePackageDirectory){
  const previous=JSON.parse(readFileSync(`${reusePackageDirectory}/result.json`))
  assert.equal(previous.bus,busName);assert.deepEqual(previous.source,report.source)
  if(freeDq){
    assert(ramFirst,'Only the unchanged first RAM package may be reused during DQ exit reassignment')
    assert([true,false].includes(previous.freeDqExitPermutation))
    if(!previous.freeDqExitPermutation)report.reusedFixedDqRamFanoutsForCpuExitAssignment=true
  }
  assert.equal(previous.nativeBootstrap.sha256,report.nativeBootstrap.sha256)
  for(const key of ['channelLayer','localModificationGridMm','lanePitchMm','handoffOrientation','sideHandoffXMm'])assert.equal(previous[key],report[key],key)
  const firstPackage=ramFirst?'U_RAM':'U_SOC'
  const paths=JSON.parse(readFileSync(`${reusePackageDirectory}/local-escapes.json`)).filter(t=>(t.route[0].y<-15)===ramFirst)
  const results=previous.localEscapes.filter(t=>t.package===firstPackage&&!t.error)
  assert.equal(paths.length,connections.length);assert.equal(results.length,connections.length)
  assert.deepEqual(new Set(paths.map(t=>t.source_trace_id)),names)
  for(const t of paths){
    const nativeStart=terminalEscapes.find(e=>e.source_trace_id===t.source_trace_id&&(e.route[0].y<-15)===ramFirst)
    const a=t.route[0],b=nativeStart.route.at(-1),end=t.route.at(-1)
    assert(Math.hypot(a.x-b.x,a.y-b.y)<1e-6)
    assert.equal(end.layer,channelLayer)
    if(ramFirst&&independentRamHandoff){
      assert.deepEqual(previous.independentRamHandoff,independentRamHandoff)
      assert.deepEqual({x:end.x,y:end.y},independentRamHandoff)
    }
    else if(sideHandoffs){assert.equal(end.x,ramFirst?-9:sideCpuX);assert(end.y-(ramFirst?0:sideCpuYOffset)>=ramLocalMinY&&end.y-(ramFirst?0:sideCpuYOffset)<=-18)}
    else assert(Math.abs(end.y-(ramFirst?ramExitY:cpuExitY))<1e-6)
    const result=results.find(r=>r.name===t.source_trace_id);assert.deepEqual(result.end,{x:end.x,y:end.y})
    modified.push(t);appendTrace(t);handoffs.set(t.source_trace_id,sideHandoffs?{x:-9,y:end.y-(ramFirst?0:sideCpuYOffset)}:{x:end.x,y:end.y})
  }
  report.localEscapes.push(...results)
  report.reusedPackageFanouts={package:firstPackage,directory:reusePackageDirectory,path:`${reusePackageDirectory}/local-escapes.json`,sha256:hash(`${reusePackageDirectory}/local-escapes.json`),count:paths.length}
  writeFileSync(`${directory}/local-escapes.json`,JSON.stringify(modified,null,2)+'\n');save()
}
// Route outward balls first. The CPU exits establish a planar channel order;
// RAM local paths may cross on the other outer layer to reproduce that order.
const ordered=[...connections].sort((a,b)=>{
  const p=n=>terminalEscapes.find(t=>t.source_trace_id===n&&t.route[0].y>-15).route.at(-1)
  return p(a.name).y-p(b.name).y||p(a.name).x-p(b.name).x
})
for(const [packageIndex,endpoint] of (ramFirst?[1,0]:[0,1]).entries()){
  if(packageIndex===0&&reusePackageDirectory)continue
  const bounds=endpoint===0?{minX:sideHandoffs?sideCpuX:Math.max(-17.5,Math.min(-1,handoffBaseX-1,independentCpuHandoff?.x??Infinity)),maxX:localMaxX,minY:cpuLocalMinY,maxY:cpuLocalMaxY}:{minX:ramLocalMinX??(sideHandoffs?-9:Math.max(-17.5,Math.min(-9,handoffBaseX-1))),maxX:localMaxX,minY:ramLocalMinY,maxY:ramLocalMaxY}
  const exitY=endpoint===0?cpuExitY:ramExitY
  const targetAt=p=>cpuPrefixOnly?{...bootstrapReport.cpuPrefixRebuild.target}:endpoint===0&&independentCpuHandoff?{...independentCpuHandoff}:endpoint===1&&independentRamHandoff?{...independentRamHandoff}:sideHandoffs?{x:endpoint===0?sideCpuX:p.x,y:p.y+(endpoint===0?sideCpuYOffset:0)}:{x:p.x,y:exitY,...layeredRamHandoffs?{layer:p.layer}:{}}
  const reserveHandoff=(name,p)=>{
    const b=targetAt(p),a=sideHandoffs?{x:b.x+1.2,y:b.y}:{x:b.x,y:b.y+(endpoint===0?1.2:-1.2)}
    shapes.push({kind:'segment',a,b,w:width,owner:ownerIds.get(name),layers:[layeredRamHandoffs?p.layer:channelLayer],guideOnly:true})
  }
  if(packageIndex===1)for(const [name,p] of handoffs){
    if(freeDq&&freeDqNames.has(name))continue
    reserveHandoff(name,p)
  }
  let packageOrder=endpoint===1&&ramOrder==='reverse'?[...ordered].reverse():[...ordered]
  if(ramOrder==='pair-first')packageOrder=[...packageOrder.filter(c=>pairHandoffs.has(c.name)),...packageOrder.filter(c=>!pairHandoffs.has(c.name))]
  if(prioritySignal&&packageIndex===0){assert(packageOrder.some(c=>c.name===prioritySignal));packageOrder=[packageOrder.find(c=>c.name===prioritySignal),...packageOrder.filter(c=>c.name!==prioritySignal)]}
  if(seedOrderDirectory&&packageIndex===1){
    const prior=JSON.parse(readFileSync(`${seedOrderDirectory}/result.json`))
    assert.equal(prior.bus,busName);assert.deepEqual(prior.source,report.source)
    assert.equal(prior.nativeBootstrap.sha256,report.nativeBootstrap.sha256)
    const previous=prior.localReplans.filter(r=>r.package===(endpoint===0?'U_SOC':'U_RAM')).at(-1);assert(previous)
    assert.deepEqual(new Set(previous.order),names)
    const order=[previous.failedName,...previous.order.filter(n=>n!==previous.failedName)]
    packageOrder=order.map(n=>connections.find(c=>c.name===n))
    if(keepPairFirst)packageOrder=[...packageOrder.filter(c=>pairHandoffs.has(c.name)),...packageOrder.filter(c=>!pairHandoffs.has(c.name))]
    report.localOrderSeed={path:`${seedOrderDirectory}/result.json`,sha256:hash(`${seedOrderDirectory}/result.json`),package:previous.package,order:packageOrder.map(c=>c.name)}
  }
  const baseShapeCount=shapes.length,baseModifiedCount=modified.length,baseReportCount=report.localEscapes.length
  const attemptedOrders=new Set()
  for(let trial=0;trial<maximumLocalReplans;trial++){
   const key=packageOrder.map(c=>c.name).join(',')
   if(attemptedOrders.has(key)){report.status='LOCAL_MODIFICATION_ORDER_CYCLE';save();process.exit(1)}
   attemptedOrders.add(key)
   shapes.length=baseShapeCount;modified.length=baseModifiedCount;report.localEscapes.length=baseReportCount
   secondHandoffs.clear()
   if(packageIndex===0){
     handoffs.clear();for(const [name,p] of fixedHandoffs)handoffs.set(name,sideHandoffs?{...p}:{...p,y:exitY})
     for(const [name,p] of fixedHandoffs)reserveHandoff(name,p)
   }
   let failedName
   for(const c of packageOrder){
    const escape=terminalEscapes.find(t=>t.source_trace_id===c.name&&(t.route[0].y<-15)===(endpoint===1));assert(escape)
    const start=escape.route.at(-1)
    const targets=packageIndex===0&&independentRamHandoff?[{...independentRamHandoff}]:packageIndex===0&&!fixedHandoffs.has(c.name)?Array.from({length:sideHandoffs?sideRamHandoffSlots:Math.max(16,connections.length+4)},(_,i)=>sideHandoffs?
      targetAt({x:-9,y:sideRamHandoffBaseY+i*lanePitch}):{x:handoffBaseX+i*lanePitch,y:exitY}).filter(p=>
      p.x<=localMaxX&&p.y>=bounds.minY&&p.y<=bounds.maxY&&[...handoffs.values()].every(q=>Math.abs(sideHandoffs?targetAt(q).y-p.y:q.x-p.x)>.31)):[targetAt(handoffs.get(c.name))]
    if(freeDq&&packageIndex===1&&freeDqNames.has(c.name)){
      targets.length=0
      for(const [name,p] of handoffs)if(freeDqNames.has(name)&&[...secondHandoffs.values()].every(q=>Math.abs(q.x-p.x)>.31))targets.push({...p,y:exitY})
    }
    const existingViaAtStart=escape.route.some(p=>p.route_type==='via'&&Math.hypot(p.x-start.x,p.y-start.y)<1e-6)
    const result=localRoute(start,targets,bounds,c.name,existingViaAtStart,layeredRamHandoffs?fixedHandoffs.get(c.name).layer:channelLayer)
    report.localEscapes.push({name:c.name,package:endpoint===0?'U_SOC':'U_RAM',...result,route:undefined})
    if(!result.route){failedName=c.name;break}
    const t={...structuredClone(escape),pcb_trace_id:`guided_${escape.pcb_trace_id}`,route:result.route}
    modified.push(t);appendTrace(t)
    if(packageIndex===0)handoffs.set(c.name,sideHandoffs?{x:-9,y:result.end.y-(endpoint===0?sideCpuYOffset:0)}:result.end)
    else secondHandoffs.set(c.name,result.end)
    writeFileSync(`${directory}/local-escapes.json`,JSON.stringify(modified,null,2)+'\n');save()
    console.log(JSON.stringify(report.localEscapes.at(-1)))
   }
   if(!failedName)break
   report.localReplans??=[];report.localReplans.push({package:endpoint===0?'U_SOC':'U_RAM',trial,order:packageOrder.map(c=>c.name),failedName})
   save();console.log(JSON.stringify(report.localReplans.at(-1)))
   if(trial===maximumLocalReplans-1){report.status='LOCAL_MODIFICATION_FAILED';save();process.exit(1)}
   // A failed exit is routed first on the next local modification pass.
   // Restore actual fixed copper each time; do not count discarded paths.
   packageOrder=[packageOrder.find(c=>c.name===failedName),...packageOrder.filter(c=>c.name!==failedName)]
   if(keepPairFirst)packageOrder=[...packageOrder.filter(c=>pairHandoffs.has(c.name)),...packageOrder.filter(c=>!pairHandoffs.has(c.name))]
  }
  if(cpuPrefixOnly){
    assert.equal(endpoint,0);assert.equal(modified.length,1)
    report.status=`STAGED_${bootstrapReport.cpuPrefixRebuild.name}_CPU_PREFIX_MANUAL_REPAIR_READY_REPLAY_AND_MATCHING_REQUIRED`
    report.scope='One guarded CPU prefix joins its retained channel/RAM tail around the staged native CSn0 route. Replay every full signal and independently check complete byte matching, connectivity, planes and physical geometry before acceptance.'
    save();console.log(JSON.stringify({status:report.status,localEscapes:report.localEscapes.length,fabricationReady:false}));process.exit(0)
  }
  if(firstPackageOnly||stagedRamOnly){
    assert.equal(endpoint,1)
    assert.equal(modified.length,connections.length)
    report.status=stagedRamOnly?'STAGED_CKE_RAM_FANOUT_READY_THREE_OTHER_RAM_TAILS_AND_CPU_CHANNEL_UNROUTED':'RAM_FANOUTS_REACHED_CHECKED_CPU_CHANNEL_HANDOFFS'
    report.scope=stagedRamOnly?'Staged routing proof only. Three prior RAM tails are temporarily removed from the routing input; rebuild them and route CKE CPU/channel before export or acceptance.':'RAM-side manual tails joined to retained checked CPU/channel sections; exact source replay and independent timing/physical checks required.'
    save();console.log(JSON.stringify({status:report.status,localEscapes:report.localEscapes.length}));process.exit(0)
  }
}
if(freeDq){
  report.status='DISJOINT_PACKAGE_FANOUTS_READY_FOR_DQ_MAP_REBIND'
  report.localExitPermutation=[...secondHandoffs].filter(([n])=>freeDqNames.has(n)).map(([name,p])=>({
    secondPackageName:name,firstPackageName:[...handoffs].find(([n,q])=>freeDqNames.has(n)&&Math.abs(q.x-p.x)<1e-6)[0],x:p.x}))
  report.firstPackage=ramFirst?'U_RAM':'U_SOC'
  report.completedSignals=0
  report.scope='Unconnected fanout candidate only; actual source netlist must be rebound and validated before native channel routing.'
  save();process.exit(0)
}
const retained=[...structuredClone(original.traces),...structuredClone(native),...modified]
const channel={...structuredClone(original),traces:retained,buses:[bus],
  connections:connections.map(c=>{
    const cpu=modified.filter(t=>t.source_trace_id===c.name&&t.route[0].y>-15)
    const ram=modified.filter(t=>t.source_trace_id===c.name&&t.route[0].y<-15)
    assert.equal(cpu.length,1);assert.equal(ram.length,1)
    const pointsToConnect=[cpu[0],ram[0]].map(t=>{
      const p=t.route.at(-1);assert.equal(p.route_type,'wire');assert.equal(p.layer,channelLayer)
      return {x:p.x,y:p.y,layer:p.layer}
    })
    return {...c,pointsToConnect}
  }),
  differentialPairs:original.differentialPairs.filter(p=>p.connectionNames.every(n=>names.has(n)))}
const channelPath=`${directory}/channel.input.simple-route.json`
writeFileSync(channelPath,JSON.stringify(channel)+'\n')
if(localOnly){
  report.status='LOCAL_FANOUTS_READY_FOR_NATIVE_CHANNEL_ROUTING'
  report.channel={input:{path:channelPath,sha256:hash(channelPath)}}
  save();console.log(JSON.stringify({status:report.status,localEscapes:report.localEscapes.length,channel:report.channel}));process.exit(0)
}
const solver=new SOLVERS.BusLanesPipelineSolver(channel,{fanout:'none'}),begun=performance.now()
let iterations=0,next=begun+10000
while(!solver.solved&&!solver.failed&&performance.now()-begun<seconds*1000){
  solver.step();iterations++
  if(performance.now()>next){console.log(JSON.stringify({phase:'native_bus_lanes_channel',iterations,elapsedSeconds:(performance.now()-begun)/1000}));next=performance.now()+10000}
}
report.channel={solved:solver.solved,failed:solver.failed,error:solver.error??null,iterations,
  elapsedSeconds:(performance.now()-begun)/1000,input:{path:channelPath,sha256:hash(channelPath)}}
if(solver.solved){
  const output=solver.getOutput();assert.equal(output.traces.length,retained.length+connections.length)
  for(let i=0;i<retained.length;i++)assert.deepEqual(output.traces[i],retained[i])
  writeFileSync(`${directory}/output.simple-route.json`,JSON.stringify(output)+'\n')
  report.completedSignals=connections.length;report.status='GUIDED_NATIVE_BYTE_ROUTED_PENDING_INDEPENDENT_CHECKS'
  report.output={path:`${directory}/output.simple-route.json`,sha256:hash(`${directory}/output.simple-route.json`)}
}else report.status='GUIDED_NATIVE_CHANNEL_FAILED_OR_TIMEOUT'
save();console.log(JSON.stringify(report));process.exitCode=solver.solved?0:1
