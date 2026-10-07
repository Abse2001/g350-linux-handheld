"""Remove whole routed branches proven disconnected from every required pad.

Use the actual freshly filled KiCad connectivity graph. Keep mixed branches and
unmapped geometry for inspection; no logical-net inference can justify removal.
Re-export and verify every numeric pad and manufacturing rule after pruning.
"""
import hashlib
import json
import sys
from pathlib import Path
import wx

wx.Log.SetLogLevel(wx.LOG_Error)
app = wx.App(False)
import pcbnew

board_path, source_path, srj_path, connectivity_path, out = map(Path, sys.argv[1:6])
assert not out.exists()
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
checked = json.loads(connectivity_path.read_text())
assert checked['boardSha256'] == sha(board_path)
assert checked['circuitSha256'] == sha(source_path)
assert checked['disconnectedConnections'] == checked['missingPadMemberships'] == 0
circuit = json.loads(source_path.read_text())
srj = json.loads(srj_path.read_text())
assert checked['requiredConnections'] == len(srj['connections'])
board = pcbnew.LoadBoard(str(board_path.resolve()))
assert board.GetCopperLayerCount() == 4
components = {e['source_component_id']: e['name'] for e in circuit if e['type'] == 'source_component'}
logical = {e['source_port_id']: e for e in circuit if e['type'] == 'source_port'}
ports = {e['pcb_port_id']: e for e in circuit if e['type'] == 'pcb_port'}
footprints = {f.GetReference(): f for f in board.GetFootprints()}
required = {p['pcb_port_id'] for c in srj['connections'] for p in c['pointsToConnect']}
connected = set()
connectivity = board.GetConnectivity()
for pid in required:
    port = logical[ports[pid]['source_port_id']]
    pads = [p for p in footprints[components[port['source_component_id']]].Pads()
            if p.GetNumber() == str(port['pin_number'])]
    assert pads
    for pad in pads:
        connected.add(pad.m_Uuid.AsString())
        connected.update(item.m_Uuid.AsString() for item in connectivity.GetConnectedItems(pad))

layers = {'top': pcbnew.F_Cu, 'inner1': pcbnew.In1_Cu, 'inner2': pcbnew.In2_Cu, 'bottom': pcbnew.B_Cu}
def coordinate(x, y):
    return round(1000000 * (100 + x)), round(1000000 * (100 - y))
def segment_key(a, b, width, layer):
    return layer, tuple(sorted((a, b))), round(width * 1000000)

tracks = {}
vias = {}
for item in board.GetTracks():
    uid = item.m_Uuid.AsString()
    if isinstance(item, pcbnew.PCB_VIA):
        p = item.GetPosition()
        vias.setdefault((p.x, p.y), set()).add(uid)
    else:
        a, b = item.GetStart(), item.GetEnd()
        key = segment_key((a.x, a.y), (b.x, b.y), pcbnew.ToMM(item.GetWidth()), item.GetLayer())
        tracks.setdefault(key, set()).add(uid)

removed = []
mixed = []
unmapped = []
trace_ids = set()
via_ids = set()
for trace in [e for e in circuit if e['type'] == 'pcb_trace']:
    physical = set()
    complete = True
    for a, b in zip(trace['route'], trace['route'][1:]):
        if a['route_type'] != 'wire' or b['route_type'] != 'wire' or a['layer'] != b['layer']:
            continue
        u, v = coordinate(a['x'], a['y']), coordinate(b['x'], b['y'])
        if u == v:
            continue
        matches = tracks.get(segment_key(u, v, a['width'], layers[a['layer']]))
        if not matches:
            complete = False
        physical.update(matches or ())
    owned = [e for e in circuit if e['type'] == 'pcb_via' and e.get('pcb_trace_id') == trace['pcb_trace_id']]
    for via in owned:
        matches = vias.get(coordinate(via['x'], via['y']))
        if not matches:
            complete = False
        physical.update(matches or ())
    if not complete or not physical:
        unmapped.append(trace['pcb_trace_id'])
        continue
    active = physical & connected
    if active:
        if active != physical:
            mixed.append(trace['pcb_trace_id'])
        continue
    assert not any(any('pcb_port_id' in key for key in point) for point in trace['route']), 'Floating branch has a labelled required port'
    trace_ids.add(trace['pcb_trace_id'])
    via_ids.update(v['pcb_via_id'] for v in owned)
    removed.append({'trace': trace['pcb_trace_id'], 'vias': [v['pcb_via_id'] for v in owned], 'physicalItems': sorted(physical)})

result = [e for e in circuit if not (e['type'] == 'pcb_trace' and e['pcb_trace_id'] in trace_ids)
          and not (e['type'] == 'pcb_via' and e['pcb_via_id'] in via_ids)]
out.write_text(json.dumps(result, indent=2) + '\n')
report = {'boardSha256': sha(board_path), 'sourceSha256': sha(source_path), 'solverInputSha256': sha(srj_path),
          'connectivitySha256': sha(connectivity_path),
          'resultSha256': sha(out), 'removed': removed, 'mixedBranchesRetained': mixed, 'unmappedBranchesRetained': unmapped,
          'requiresFreshNumericConnectivityAndManufacturingChecks': True, 'fabricationReady': False}
Path(str(out) + '.pruning.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'removedBranches': len(removed), 'removedVias': len(via_ids), 'mixedBranches': len(mixed), 'unmappedBranches': len(unmapped)}))
