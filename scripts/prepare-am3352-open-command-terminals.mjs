import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Keep the checked natural fanouts open on top. Place no speculative
// terminal holes: later manual bridges add vias only where needed.
const [bootstrap,directory,sourcePath,clockTerminalDirectory,extraRamTerminalSignalsArg='',extraTerminalPackages='ram']=process.argv.slice(2);assert(bootstrap&&directory&&sourcePath)
assert(['ram','both'].includes(extraTerminalPackages))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),original=read(`${bootstrap}/input.simple-route.json`)
const native=read(`${bootstrap}/signal-escapes.native.json`),source=read(sourcePath)
assert.equal(hash(prior.source.path),prior.source.sha256)
assert.deepEqual(source.filter(e=>e.type!=='source_project_metadata'),read(prior.source.path).filter(e=>e.type!=='source_project_metadata'))
const bus=original.buses.find(b=>b.name==='DDR_COMMAND_CLOCK'),names=new Set(bus.connectionNames)
assert.equal(names.size,26);assert.equal(native.length,96)
const pair=original.differentialPairs.find(p=>p.connectionNames.every(n=>names.has(n)))
const extraRamTerminalSignals=extraRamTerminalSignalsArg.split(',').filter(Boolean)
assert.equal(new Set(extraRamTerminalSignals).size,extraRamTerminalSignals.length)
assert(extraRamTerminalSignals.every(n=>names.has(n)&&!pair.connectionNames.includes(n)))
assert(!extraRamTerminalSignals.length||clockTerminalDirectory)
if(clockTerminalDirectory){
 const clockNative=read(`${clockTerminalDirectory}/signal-escapes.native.json`)
 for(let i=0;i<native.length;i++)if(pair.connectionNames.includes(native[i].source_trace_id)||
  extraRamTerminalSignals.includes(native[i].source_trace_id)&&(extraTerminalPackages==='both'||native[i].pcb_trace_id.endsWith('_1')))
  native[i]=clockNative.find(t=>t.pcb_trace_id===native[i].pcb_trace_id)
 assert.equal(native.filter(t=>pair.connectionNames.includes(t.source_trace_id)).length,4)
}
const local=[],escapes=[],connections=original.connections.filter(c=>names.has(c.name)).map(c=>({...c,pointsToConnect:[0,1].map(i=>{
 const a=native.find(t=>t.pcb_trace_id===`local_dogbone_${c.name}_${i}`).route.at(-1)
 const layer=clockTerminalDirectory&&(pair.connectionNames.includes(c.name)||
  extraRamTerminalSignals.includes(c.name)&&(i||extraTerminalPackages==='both'))?'bottom':'top'
 assert.equal(a.layer,layer)
 const b={x:a.x,y:i||layer==='bottom'?a.y:-10.52};assert(Math.abs(a.y-b.y)<=.020001)
 const route=[{...a},...(a.y===b.y?[]:[{route_type:'wire',...b,layer,width:.1016}])]
 local.push({pcb_trace_id:`guided_local_dogbone_${c.name}_${i}`,source_trace_id:c.name,connection_name:c.name,route})
 escapes.push({name:c.name,package:i?'U_RAM':'U_SOC',end:b,length:Math.abs(a.y-b.y),newVias:0})
 return {...b,layer}
})}))
const buses=connections.filter(c=>!pair.connectionNames.includes(c.name)).map(c=>({name:`DDR_COMMAND_CLOCK_${c.name}`,
 busId:`DDR_COMMAND_CLOCK_${c.name}`,connectionNames:[c.name],traceWidth:.1016,
 allowedLayers:extraRamTerminalSignals.includes(c.name)?['top','bottom']:['top']}))
buses.push({name:'DDR_CK_PAIR',busId:'DDR_CK_PAIR',connectionNames:pair.connectionNames,traceWidth:.1016,maxLengthSkew:.127,allowedLayers:[clockTerminalDirectory?'bottom':'top']})
const input={...original,connections,traces:[...original.traces,...native,...local],buses,differentialPairs:[pair]}
mkdirSync(directory,{recursive:true})
for(const [name,value] of [['signal-escapes.native.json',native],['local-escapes.json',local],['channel.input.simple-route.json',input]])
 writeFileSync(`${directory}/${name}`,JSON.stringify(value)+'\n')
const path=`${directory}/channel.input.simple-route.json`
const report={...prior,status:'OPEN_NATURAL_COMMAND_TERMINALS_PREPARED_UNQUALIFIED',source:{...prior.source,path:sourcePath,sha256:hash(sourcePath)},
 sourceRebinding:{original:prior.source,current:{path:sourcePath,sha256:hash(sourcePath)},allPhysicalAndLogicalRecordsUnchanged:true},
 nativeBootstrap:{path:`${directory}/signal-escapes.native.json`,sha256:hash(`${directory}/signal-escapes.native.json`),dogbones:96},
 channel:{input:{path,sha256:hash(path)}},localEscapes:escapes,nativeRoutingPhases:buses,
 ...(clockTerminalDirectory?{manualNativeEscapeCorrection:{...prior.manualNativeEscapeCorrection,clockOnlyTerminalVias:{
  path:`${clockTerminalDirectory}/signal-escapes.native.json`,sha256:hash(`${clockTerminalDirectory}/signal-escapes.native.json`),
  selectedSignals:pair.connectionNames,addedFullDepthVias:4}}}:{}),
 ...(extraRamTerminalSignals.length?{additionalCommandTerminalVias:{
  source:{path:`${clockTerminalDirectory}/signal-escapes.native.json`,sha256:hash(`${clockTerminalDirectory}/signal-escapes.native.json`)},
  selectedSignals:extraRamTerminalSignals,packages:extraTerminalPackages==='both'?['U_SOC','U_RAM']:['U_RAM'],
  changedTraceIds:extraRamTerminalSignals.flatMap(n=>(extraTerminalPackages==='both'?[0,1]:[1]).flatMap(i=>[`local_dogbone_${n}_${i}`,`guided_local_dogbone_${n}_${i}`])),
  addedFullDepthVias:extraRamTerminalSignals.length*(extraTerminalPackages==='both'?2:1),accepted:false}}:{}),
 deferredCommandClassTimingRequirement:bus,addedSpeculativeTerminalVias:(clockTerminalDirectory?4:0)+extraRamTerminalSignals.length*(extraTerminalPackages==='both'?2:1),completedSignals:0,timingQualified:false,fabricationReady:false}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,openTerminals:52,extraVias:report.addedSpeculativeTerminalVias}))
