"""Check every native pad-to-via reservation with KiCad connectivity."""
from pathlib import Path
import hashlib
import json
import sys
import wx
wx.Log.SetLogLevel(wx.LOG_Error)
application = wx.App(False)
import pcbnew

board_path, circuit_path, native_path, report_path = map(Path, sys.argv[1:5])
circuit = json.loads(circuit_path.read_text())
native = json.loads(native_path.read_text())
map_path = Path(sys.argv[5]) if len(sys.argv) > 5 else Path('lib/am3352/memory-byte1-top-centered-swizzled-connections.json')
mapping = json.loads(map_path.read_text())
assert len(mapping) == 49
board = pcbnew.LoadBoard(str(board_path.resolve()))
assert board.GetCopperLayerCount() == 4
footprints = {f.GetReference(): f for f in board.GetFootprints()}
assert len(list(footprints['U_SOC'].Pads())) == 324
assert len(list(footprints['U_RAM'].Pads())) == 96
connectivity = board.GetConnectivity()
vias = [t for t in board.GetTracks() if isinstance(t, pcbnew.PCB_VIA)]
assert len(vias) == 165
assert len(native) == 96
results = []
for signal in mapping:
    if signal['name'] == 'DDR_RESETn':
        continue
    trace = next(e for e in circuit if e['type'] == 'source_trace' and e['name'] == signal['name'])
    for endpoint, name, pin_key, ball_key in [(0, 'U_SOC', 'socPin', 'socBall'), (1, 'U_RAM', 'ramPin', 'ramBall')]:
        escape = next(t for t in native if t['pcb_trace_id'] == f"local_dogbone_{trace['source_trace_id']}_{endpoint}")
        pin = int(signal[pin_key].removeprefix('pin'))
        component = next(e for e in circuit if e['type'] == 'source_component' and e['name'] == name)
        port = next(e for e in circuit if e['type'] == 'source_port' and e['source_component_id'] == component['source_component_id'] and e['pin_number'] == pin)
        assert port['name'] == signal[ball_key]
        assert port['source_port_id'] in trace['connected_source_port_ids']
        pad = next(p for p in footprints[name].Pads() if p.GetNumber() == str(pin))
        start = escape['route'][0]
        assert abs(pcbnew.ToMM(pad.GetPosition().x) - 100 - start['x']) < 1e-5
        assert abs(100 - pcbnew.ToMM(pad.GetPosition().y) - start['y']) < 1e-5
        sites = [p for p in escape['route'] if p['route_type'] == 'via']
        assert len(sites) == 1
        site = sites[0]
        matches = [v for v in vias if abs(pcbnew.ToMM(v.GetPosition().x) - 100 - site['x']) < 1e-5 and abs(100 - pcbnew.ToMM(v.GetPosition().y) - site['y']) < 1e-5]
        assert len(matches) == 1
        via = matches[0]
        assert abs(pcbnew.ToMM(via.GetWidth(pcbnew.F_Cu)) - .4572) < 1e-5
        assert abs(pcbnew.ToMM(via.GetDrillValue()) - .254) < 1e-5
        assert via.TopLayer() == pcbnew.F_Cu and via.BottomLayer() == pcbnew.B_Cu
        assert pad.GetNetCode() == via.GetNetCode() != 0
        connected = {item.m_Uuid.AsString() for item in connectivity.GetConnectedItems(pad)}
        ok = via.m_Uuid.AsString() in connected
        results.append({'name': signal['name'], 'package': name, 'ball': signal[ball_key], 'pin': pin,
                        'via': {'x': site['x'], 'y': site['y']}, 'padToViaConnected': ok})
        assert ok, f"Disconnected native breakout: {name} {signal['name']}"
assert len(results) == 96
def artifact(path):
    return {'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
report = {'status': 'KICAD_ALL_96_NATIVE_PAD_TO_VIA_BREAKOUTS_CONNECTED',
          'board': artifact(board_path), 'circuit': artifact(circuit_path), 'nativeEscapes': artifact(native_path),
          'memoryMap': artifact(map_path),
          'synchronousSignals': 48, 'cpuBreakouts': 48, 'ramBreakouts': 48, 'physicalVias': len(vias),
          'copperLayers': 4, 'results': results, 'fabricationReady': False,
          'scope': 'Independent pad-to-via reservation check only. Full signal channels and DDR timing remain unqualified.'}
report_path.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['status', 'cpuBreakouts', 'ramBreakouts', 'physicalVias']}))
