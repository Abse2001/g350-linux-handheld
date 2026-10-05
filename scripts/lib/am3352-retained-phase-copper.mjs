import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertRamByte1TipCorrection} from './am3352-ram-native-tip-correction.mjs'

export function assertRetainedPhaseCopper(report,input){
  const retained=report.retainedPhaseCopper
  if(!retained)return 0
  const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
  assert.equal(retained.phase,'DDR_BYTE0');assert.equal(retained.tracePieces,33)
  for(const a of [retained.paths,retained.nativeRun])assert.equal(hash(a.path),a.sha256)
  const run=read(retained.nativeRun.path),paths=read(retained.paths.path)
  assert.equal(run.source.sha256,report.source.sha256);assert.equal(hash(run.source.path),run.source.sha256)
  assert.equal(run.completedSignals,11);assert.equal(run.bus,'DDR_BYTE0')
  assert.equal(run.status,'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED')
  assert.equal(run.mode,'pair-matched-bootstrap')
  assert.equal(run.timingRequirements.buses[0].maxLengthSkew,.635)
  assert.equal(run.timingRequirements.differentialPairs[0].lengthTolerance,.127)
  assert.equal(hash(run.output.path),run.output.sha256)
  const output=read(run.output.path),native=read(run.nativeBootstrap.path)
  assert.equal(hash(run.nativeBootstrap.path),run.nativeBootstrap.sha256)
  if(report.nativeBootstrap.sha256!==run.nativeBootstrap.sha256){
    const correction=report.manualRamNativeTipCorrection
    assert.equal(correction.kind,'UNUSED_RAM_BYTE1_TOP_BRANCHES_REMOVED')
    assert.equal(correction.priorNative.sha256,run.nativeBootstrap.sha256)
    assert.equal(hash(correction.priorNative.path),correction.priorNative.sha256)
    assert.equal(hash(report.nativeBootstrap.path),report.nativeBootstrap.sha256)
    assert.deepEqual(assertRamByte1TipCorrection(native,read(report.nativeBootstrap.path),read(report.source.path)),correction.changedTraceIds)
  }
  assert.equal(native.length,96);assert.equal(run.sourceTracesRetained,69)
  assert.equal(output.traces.length,198);assert.equal(paths.length,33)
  assert.deepEqual(output.traces.slice(69,165),native)
  assert.deepEqual(output.traces.slice(165),paths)
  assert.deepEqual(input.traces.slice(0,69),output.traces.slice(0,69))
  assert.deepEqual(input.traces.slice(69,102),paths)
  const source=read(report.source.path)
  const names=new Set(source.find(e=>e.type==='source_bus'&&e.name==='DDR_BYTE0').source_trace_ids)
  assert.equal(names.size,11);assert(paths.every(t=>names.has(t.source_trace_id)))
  assert(paths.every(t=>t.route.every(p=>p.route_type==='wire'?['top','bottom'].includes(p.layer):
    p.route_type==='via'&&p.via_diameter===.4572&&p.via_hole_diameter===.254)))
  return 33
}
