"""Bind a fresh cleanup source to native, KiCad, pad and Gerber evidence."""
import hashlib,json,math,sys
from pathlib import Path
source_root,verified_root,shorts_root,output=map(Path,sys.argv[1:5]);assert not output.exists()
entry=sys.argv[5] if len(sys.argv)>5 else 'experiments/am3352-g350-clean-full-board-length-progress-replay.circuit.tsx'
assert Path(entry).is_file() and entry.endswith('.circuit.tsx')
expected_skew=int(sys.argv[6]) if len(sys.argv)>6 else 3
assert 0<=expected_skew<=3
read=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
artifact=lambda p:dict(path=str(p),sha256=sha(p))
source=source_root/'compiled.circuit.json';filled=verified_root/'fresh-filled.circuit.json';board=verified_root/'filled/ground-reference.kicad_pcb'
c=read(source);native=read(source_root/'native.json');filled_native=read(verified_root/'native-filled.json');build=read(source_root/'result.json')
execution=read(source_root/'execution.json')
assert execution['versions']=={'tscircuit':'0.0.2803','@tscircuit/core':'0.0.2107','@tscircuit/cli':'0.1.2258','@tscircuit/checks':'0.0.242','@tscircuit/capacity-autorouter':'0.0.962'}
assert execution['args'][0]=='build' and execution['args'][1]==entry
assert build['execution']['sha256']==sha(source_root/'execution.json')
assert build['code']==(1 if expected_skew else 0) and not build['forcedTimeout'] and build['freshCompiledSource'] and build['sourceDefinitionsUnchanged']
assert any(r['path']==str(source) and r['sha256']==sha(source) for r in build['artifacts'])
assert native['sourceSha256']==sha(source) and filled_native['sourceSha256']==sha(filled)
for report in (native,filled_native):
 assert report['counts']['checkPcbBusLengthSkew']==expected_skew and all(v==0 for k,v in report['counts'].items() if k!='checkPcbBusLengthSkew')
 assert report['componentPlacementsExactlyPreserved']
 assert report['checksSha256']=='1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc'
assert read(verified_root/'candidate.circuit.json')==c
conn=read(verified_root/'filled/final-connectivity.json');assert conn['boardSha256']==sha(board) and conn['circuitSha256']==sha(source)
assert conn['requiredConnections']==conn['connectedConnections']==217 and not conn['disconnectedConnections'] and not conn['missingPadMemberships']
drc=read(verified_root/'filled/drc.json')
for category in ('violations','unconnected_items','schematic_parity'):assert not drc[category]
settings=read(verified_root/'filled/ground-reference.kicad_pro')['board']['design_settings']
assert all(v!='ignore' for v in settings['rule_severities'].values()) and not settings.get('drc_exclusions',[])
shorts=read(shorts_root/'execution.json');assert shorts['inputSha256']==sha(filled) and shorts['mode']=='gerber' and shorts['layer']=='all' and shorts['exitCode']==0
assert shorts['cliVersion']=='0.1.2258'
source_traces={s['source_trace_id']:s for s in c if s['type']=='source_trace'}
traces=[s for s in c if s['type']=='pcb_trace'];ddr={sid for sid,s in source_traces.items() if s.get('name','').startswith('DDR_')};assert len(ddr)==49
board_record=next(s for s in c if s['type']=='pcb_board');assert board_record['num_layers']==4
assert sum(s['type']=='pcb_component' for s in c)==280
vias=[s for s in c if s['type']=='pcb_via']
assert len(vias)==824
assert all(set(v['layers'])=={'top','inner1','inner2','bottom'} and abs(v['outer_diameter']-.4572)<1e-8 and abs(v['hole_diameter']-.254)<1e-8 for v in vias)
length=lambda t:sum((1.6 if b['route_type']=='via' else 0)+(math.hypot(b['x']-a['x'],b['y']-a['y']) if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer'] else 0) for a,b in zip(t['route'],t['route'][1:]))
timing=[]
for bus in c:
 if bus['type']!='source_bus' or bus.get('name') not in ['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK','DDR_DQS0_PAIR','DDR_DQS1_PAIR','DDR_CK_PAIR']:continue
 rows=[dict(signal=source_traces[sid]['name'],nativeLengthMm=sum(length(t) for t in traces if t.get('source_trace_id')==sid)) for sid in bus['source_trace_ids']]
 lo=min(rows,key=lambda r:r['nativeLengthMm']);hi=max(rows,key=lambda r:r['nativeLengthMm']);skew=hi['nativeLengthMm']-lo['nativeLengthMm']
 timing.append(dict(bus=bus['name'],shortest=lo,longest=hi,skewMm=skew,limitMm=bus['max_length_skew'],passNativeSkew=skew<=bus['max_length_skew']))
assert sum(not t['passNativeSkew'] for t in timing)==expected_skew
assert read(verified_root/'wrapper-exit.json')['exitCode']==0
skew_status=['ZERO_SKEW_FAILURES','ONE_SKEW_FAILURE','TWO_SKEW_FAILURES','THREE_SKEW_FAILURES'][expected_skew]
report=dict(status='WHOLE_BOARD_CONNECTED_ZERO_DRC_SHORTS_DDR_LENGTH_PROGRESS_'+skew_status,checkedEntry='experiments/am3352-g350-clean-full-board-length-progress-replay.circuit.tsx',compiledCircuit=artifact(source),freshFilledCircuit=artifact(filled),independentBoard=artifact(board),freshEditableSource=True,sourceDefinitionsUnchanged=True,buildExitCode=build['code'],buildElapsedSeconds=build['elapsedSeconds'],nativeSource=artifact(source_root/'native.json'),nativeFilled=artifact(verified_root/'native-filled.json'),sourceNativeCounts=native['counts'],freshFilledNativeCounts=filled_native['counts'],independentConnectivity=conn,independentDrc=artifact(verified_root/'filled/drc.json'),kicadErrors=0,kicadWarnings=0,kicadUnconnectedItems=0,danglingTracks=0,danglingVias=0,ignoredKiCadRules=[],kiCadExclusions=[],allLayerGerberShorts=0,shortsVerification=shorts,connectedDdrSignals=49,parts=280,numLayers=4,ramRotationDegrees=90,standardThroughVias=824,ddrCopperExactlyPreserved=False,componentPlacementsExactlyPreserved=True,ddrNativeTiming=timing,nativeViaAllowanceMm=1.6,snapshot=artifact(verified_root/'pcb-all-layers.png'),fullElectricalTimingQualified=False,fabricationReady=False)
report['baselineCleanupSummary']='checks/integrated/g350-dangling-copper-cleanup/summary.json'
report['checkedEntry']=entry
report['latestRuntime']={'tscircuit':execution['versions']['tscircuit'],'core':execution['versions']['@tscircuit/core'],'cli':execution['versions']['@tscircuit/cli'],'checks':execution['versions']['@tscircuit/checks']}
solver_input=read(verified_root/'full-solver-input.json')
assert len({p['pcb_port_id'] for r in solver_input['connections'] for p in r['pointsToConnect']})==1032
collection=read(verified_root/'full-solver-input.json.collection.json')
assert collection['physicalPorts']==1032 and collection['connections']==217 and collection['resultSha256']==sha(verified_root/'full-solver-input.json')
for row in collection['inputs']:assert row['sha256']==sha(Path(row['path']))
ground=[r for r in conn['results'] if r['net']=='GND'];assert len(ground)==1 and ground[0]['requiredPads']==298 and ground[0]['connected']
report['requiredNumericPorts']=1032;report['groundPorts']=298
report['qualificationWrapper']=artifact(verified_root/'wrapper-exit.json')
report['nativeSkewFailures']=expected_skew
output.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['status','kicadErrors','kicadWarnings','connectedDdrSignals','allLayerGerberShorts','fabricationReady']}))
