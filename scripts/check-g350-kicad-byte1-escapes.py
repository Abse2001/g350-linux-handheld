"""Check 22 numeric package pads to their exact byte1 landing vias."""
from pathlib import Path
import hashlib
import json
import math
import sys
import wx
wx.Log.SetLogLevel(wx.LOG_Error)
application = wx.App(False)
import pcbnew

board_path, circuit_path, cache_path, report_path = map(Path, sys.argv[1:5])
seeded_strobes = '--seeded-strobes' in sys.argv[5:]
map_path = Path('lib/am3352/memory-byte1-top-centered-swizzled-connections.json')
circuit = json.loads(circuit_path.read_text())
cache = json.loads(cache_path.read_text())
mapping = json.loads(map_path.read_text())
names = {'DDR_D' + str(i) for i in range(8, 16)} | {'DDR_DQM1', 'DDR_DQS1', 'DDR_DQSn1'}
signals = [s for s in mapping if s['name'] in names]
assert len(signals) == 11 and len(cache) == 22
board = pcbnew.LoadBoard(str(board_path.resolve()))
assert board.GetCopperLayerCount() == 4
footprints = {f.GetReference(): f for f in board.GetFootprints()}
assert len(list(footprints['U_SOC'].Pads())) == 324
assert len(list(footprints['U_RAM'].Pads())) == 96
vias = [t for t in board.GetTracks() if isinstance(t, pcbnew.PCB_VIA)]
assert len(vias) == 141
connectivity = board.GetConnectivity()
records = []
checked_paths = set()
connected_channels = []
for signal in signals:
    pads = []
    for package, pin_key, ball_key in [('U_SOC', 'socPin', 'socBall'), ('U_RAM', 'ramPin', 'ramBall')]:
        pin = int(signal[pin_key].removeprefix('pin'))
        source = next(e for e in circuit if e['type'] == 'source_component' and e['name'] == package)
        sp = next(e for e in circuit if e['type'] == 'source_port' and e['source_component_id'] == source['source_component_id'] and e['pin_number'] == pin)
        assert sp['name'] == signal[ball_key]
        pp = next(e for e in circuit if e['type'] == 'pcb_port' and e['source_port_id'] == sp['source_port_id'])
        pad = next(p for p in footprints[package].Pads() if p.GetNumber() == str(pin))
        assert abs(pcbnew.ToMM(pad.GetPosition().x) - 100 - pp['x']) < 1e-5
        assert abs(100 - pcbnew.ToMM(pad.GetPosition().y) - pp['y']) < 1e-5
        selector = package + '.pin' + str(pin)
        path = next(p for p in cache if p['connection'] == selector)
        assert selector not in checked_paths
        checked_paths.add(selector)
        route = path['route']
        assert math.hypot(route[0]['x'] - pp['x'], route[0]['y'] - pp['y']) < 1e-8
        site = next(p for p in route if p['route_type'] == 'via')
        assert len([p for p in route if p['route_type'] == 'via']) == 1
        assert site['from_layer'] == 'top' and site['to_layer'] == 'bottom'
        matches = [v for v in vias if math.hypot(pcbnew.ToMM(v.GetPosition().x) - 100 - site['x'], 100 - pcbnew.ToMM(v.GetPosition().y) - site['y']) < 1e-5]
        assert len(matches) == 1
        via = matches[0]
        assert via.GetNetCode() == pad.GetNetCode() != 0
        assert via.TopLayer() == pcbnew.F_Cu and via.BottomLayer() == pcbnew.B_Cu
        assert abs(pcbnew.ToMM(via.GetDrillValue()) - .254) < 1e-6
        for layer in (pcbnew.F_Cu, pcbnew.In1_Cu, pcbnew.In2_Cu, pcbnew.B_Cu):
            assert abs(pcbnew.ToMM(via.GetWidth(layer)) - .4572) < 1e-6
        connected = {i.m_Uuid.AsString() for i in connectivity.GetConnectedItems(pad)}
        assert via.m_Uuid.AsString() in connected, selector + ': open pad-to-via escape'
        planar_length = sum(math.hypot(b['x'] - a['x'], b['y'] - a['y']) for a, b in zip(route, route[1:]) if a['route_type'] == b['route_type'] == 'wire' and a['layer'] == b['layer'])
        records.append(dict(signal=signal['name'], package=package, ball=sp['name'], numericPin=pin, via=dict(x=site['x'], y=site['y']), padToViaConnected=True, planarLengthMm=planar_length))
        pads.append(pad)
    assert pads[0].GetNetCode() == pads[1].GetNetCode()
    cpu_connected = {i.m_Uuid.AsString() for i in connectivity.GetConnectedItems(pads[0])}
    connected = pads[1].m_Uuid.AsString() in cpu_connected
    expected = seeded_strobes and signal['name'] in {'DDR_DQS1', 'DDR_DQSn1'}
    assert connected == expected, signal['name'] + ': unexpected completed-channel state'
    if connected:
        connected_channels.append(signal['name'])
assert len(checked_paths) == 22
def artifact(p):
    return dict(path=str(p), sha256=hashlib.sha256(p.read_bytes()).hexdigest())
report = dict(status='PASS_22_NUMERIC_PAD_TO_EXACT_THROUGH_VIA_ESCAPES', board=artifact(board_path), circuit=artifact(circuit_path), escapeCache=artifact(cache_path), pinMap=artifact(map_path), checker=artifact(Path(__file__)), checkedPackagePads=22, connectedByte1Channels=len(connected_channels), connectedByte1Names=connected_channels, fourCopperLayers=True, fullDepthStandardVias=True, records=records, fabricationReady=False, electricalTimingQualified=False)
report_path.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['status', 'checkedPackagePads', 'connectedByte1Channels']}))
