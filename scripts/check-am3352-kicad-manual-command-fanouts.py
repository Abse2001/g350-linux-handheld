"""Verify the new manual command prefixes reach their through-vias in KiCad."""
from pathlib import Path
import hashlib
import json
import sys
import wx
wx.Log.SetLogLevel(wx.LOG_Error)
application = wx.App(False)
import pcbnew

board_path, circuit_path, native_path, report_path = map(Path, sys.argv[1:5])
expected_vias = int(sys.argv[5]) if len(sys.argv) > 5 else 193
bus_scope = sys.argv[6] if len(sys.argv) > 6 else 'DDR_COMMAND_CLOCK'
assert bus_scope in ['DDR_COMMAND_CLOCK', 'DDR_BYTES', 'DDR_ALL_SYNC', 'DDR_BYTE1', 'DDR_BYTE1_AND_COMMAND']
circuit = json.loads(circuit_path.read_text())
native = json.loads(native_path.read_text())['escapes']
assert len(native) == 52
mapping_path = Path(sys.argv[7]) if len(sys.argv) > 7 else Path('lib/am3352/memory-byte1-top-centered-swizzled-connections.json')
mapping = json.loads(mapping_path.read_text())
assert len(mapping) == 49 and len({row['name'] for row in mapping}) == 49
bus_names = ['DDR_BYTE0', 'DDR_BYTE1', 'DDR_COMMAND_CLOCK'] if bus_scope == 'DDR_ALL_SYNC' else ['DDR_BYTE0', 'DDR_BYTE1'] if bus_scope == 'DDR_BYTES' else ['DDR_BYTE1', 'DDR_COMMAND_CLOCK'] if bus_scope == 'DDR_BYTE1_AND_COMMAND' else [bus_scope]
phase_ids = {identity for e in circuit if e['type'] == 'source_bus' and e['name'] in bus_names for identity in e['source_trace_ids']}
expected_signals = 48 if bus_scope == 'DDR_ALL_SYNC' else 22 if bus_scope == 'DDR_BYTES' else 11 if bus_scope == 'DDR_BYTE1' else 37 if bus_scope == 'DDR_BYTE1_AND_COMMAND' else 26
traces = [e for e in circuit if e['type'] == 'source_trace' and e['source_trace_id'] in phase_ids]
assert len(traces) == expected_signals
if bus_scope == 'DDR_BYTES':
    assert len(native) == 44
if bus_scope == 'DDR_ALL_SYNC':
    assert len(native) == 96
if bus_scope == 'DDR_BYTE1':
    assert len(native) == 22
if bus_scope == 'DDR_BYTE1_AND_COMMAND':
    assert len(native) == 74
board = pcbnew.LoadBoard(str(board_path.resolve()))
assert board.GetCopperLayerCount() == 4
footprints = {f.GetReference(): f for f in board.GetFootprints()}
assert len(list(footprints['U_SOC'].Pads())) == 324
assert len(list(footprints['U_RAM'].Pads())) == 96
connectivity = board.GetConnectivity()
vias = [t for t in board.GetTracks() if isinstance(t, pcbnew.PCB_VIA)]
assert len(vias) == len([e for e in circuit if e['type'] == 'pcb_via']) == expected_vias
records = []
def at(position, point):
    return abs(pcbnew.ToMM(position.x) - 100 - point['x']) < 1e-5 and abs(100 - pcbnew.ToMM(position.y) - point['y']) < 1e-5
for trace in traces:
    signal = next(m for m in mapping if m['name'] == trace['name'])
    for endpoint, name, pin_key, ball_key in [(0, 'U_SOC', 'socPin', 'socBall'), (1, 'U_RAM', 'ramPin', 'ramBall')]:
        escape = next(t for t in native if t['pcb_trace_id'] == f"manual_{trace['source_trace_id']}_{'cpu' if endpoint == 0 else 'ram'}")
        pin = int(signal[pin_key].removeprefix('pin'))
        component = next(e for e in circuit if e['type'] == 'source_component' and e['name'] == name)
        port = next(e for e in circuit if e['type'] == 'source_port' and e['source_component_id'] == component['source_component_id'] and e['pin_number'] == pin)
        assert port['name'] == signal[ball_key] and port['source_port_id'] in trace['connected_source_port_ids']
        pad = next(p for p in footprints[name].Pads() if p.GetNumber() == str(pin))
        assert at(pad.GetPosition(), escape['route'][0])
        end = escape['route'][-1]
        assert end['route_type'] == 'wire' and end['layer'] in ['top', 'bottom']
        end_layer = pcbnew.F_Cu if end['layer'] == 'top' else pcbnew.B_Cu
        matches = []
        connected_ids = {item.m_Uuid.AsString() for item in connectivity.GetConnectedItems(pad)}
        # Connectivity returns some vias as base PCB_TRACK proxies. Inspect
        # the actual board items for their via position, then require the
        # same UUID in KiCad's connected set; do not infer connection by net.
        for item in board.GetTracks():
            if item.GetNetCode() != pad.GetNetCode() or item.m_Uuid.AsString() not in connected_ids:
                continue
            if isinstance(item, pcbnew.PCB_VIA):
                # A fanout may end at a full-depth via's top land. Its
                # future top channel is absent in this diagnostic.
                if item.TopLayer() == pcbnew.F_Cu and item.BottomLayer() == pcbnew.B_Cu and at(item.GetPosition(), end):
                    matches.append(item)
            elif isinstance(item, pcbnew.PCB_TRACK) and item.GetLayer() == end_layer and (at(item.GetStart(), end) or at(item.GetEnd(), end)):
                matches.append(item)
        assert matches, f"Natural fanout is disconnected: {name} {signal['name']}"
        records.append({'name': signal['name'], 'package': name, 'ball': signal[ball_key], 'pin': pin,
                        'outboardEnd': {'x': end['x'], 'y': end['y'], 'layer': end['layer']}, 'padToOutboardConnected': True})
assert len(records) == 2 * expected_signals
def artifact(path):
    return {'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
status = 'KICAD_ALL_74_REMAINING_SYNCHRONOUS_TERMINALS_CONNECTED' if bus_scope == 'DDR_BYTE1_AND_COMMAND' else 'KICAD_ALL_22_BYTE1_LOCAL_TERMINALS_CONNECTED' if bus_scope == 'DDR_BYTE1' else 'KICAD_ALL_96_NATIVE_SYNCHRONOUS_TERMINALS_CONNECTED' if bus_scope == 'DDR_ALL_SYNC' else 'KICAD_ALL_44_NATIVE_BYTE_TERMINALS_CONNECTED' if bus_scope == 'DDR_BYTES' else 'KICAD_ALL_52_NATURAL_COMMAND_FANOUTS_CONNECTED' if expected_vias == 175 else 'KICAD_ALL_52_COMMAND_TERMINALS_CONNECTED'
assert bus_scope == 'DDR_COMMAND_CLOCK'
report = {'status': 'KICAD_ALL_52_MANUAL_COMMAND_PAD_TO_VIA_FANOUTS_CONNECTED',
          'board': artifact(board_path), 'circuit': artifact(circuit_path), 'savedFanouts': artifact(native_path),
          'connectionMap': artifact(mapping_path),
          'cpuFanoutsConnected': expected_signals, 'ramFanoutsConnected': expected_signals, 'physicalVias': len(vias), 'copperLayers': 4,
          'records': records, 'fabricationReady': False, 'timingQualified': False,
          'scope': 'Exact numeric pad to saved local terminal only; full CPU/RAM DDR channels remain unfinished.'}
report_path.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['status', 'cpuFanoutsConnected', 'ramFanoutsConnected', 'physicalVias']}))
