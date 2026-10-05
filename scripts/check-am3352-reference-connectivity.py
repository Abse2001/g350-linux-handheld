"""Independent KiCad copper connectivity audit for the RAM reference escapes."""
from pathlib import Path
import hashlib
import json
import sys

import wx
wx.Log.SetLogLevel(wx.LOG_Error)
application = wx.App(False)
import pcbnew

board_path, circuit_path, report_path = map(Path, sys.argv[1:4])
circuit = json.loads(circuit_path.read_text())
escape_path = Path(sys.argv[4]) if len(sys.argv) > 4 else Path('lib/am3352/ram-reference-escapes.json')
escapes = json.loads(escape_path.read_text())
loops = json.loads(Path('lib/am3352/ram-bypass-loop-layout.json').read_text())
power_bridge = len(sys.argv) > 5 and sys.argv[5] == 'rotated-d2-power-bridge'
assert len(sys.argv) <= 5 or power_bridge
board = pcbnew.LoadBoard(str(board_path.resolve()))
assert board.GetCopperLayerCount() == 4
components = [e for e in circuit if e['type'] == 'source_component']
ram_source = next(e for e in components if e['name'] == 'U_RAM')
assert ram_source['manufacturer_part_number'] == 'MT41K256M16TW-107:P'
ram = next(f for f in board.GetFootprints() if f.GetReference() == 'U_RAM')
assert len(list(ram.Pads())) == 96
connectivity = board.GetConnectivity()
zones = {z.GetNetname(): z for z in board.Zones() if z.GetNetname()}
assert set(zones) == {'GND', 'DDR_1V5'}
assert zones['GND'].GetLayer() == pcbnew.In1_Cu
assert zones['DDR_1V5'].GetLayer() == pcbnew.In2_Cu
for zone in zones.values():
    assert zone.IsFilled() and zone.GetFilledPolysList(zone.GetLayer()).OutlineCount() == 1


def mm_point(item):
    p = item.GetPosition()
    return pcbnew.ToMM(p.x), pcbnew.ToMM(p.y)


def near(a, b):
    return abs(a[0] - b[0]) < 1e-5 and abs(a[1] - b[1]) < 1e-5


bridge_tracks = []
if power_bridge:
    source = next(e for e in circuit if e['type'] == 'source_trace' and e.get('name') == 'RAM_D2_B2_INNER2_POWER_BRIDGE')
    trace = next(e for e in circuit if e['type'] == 'pcb_trace' and e.get('source_trace_id') == source['source_trace_id'])
    expected = [(2, -30.2), (2.4, -30.6), (2.4, -31.4), (2, -31.8)]
    assert len(trace['route']) == 4
    for p, xy in zip(trace['route'], expected):
        assert near((p['x'], p['y']), xy) and p['layer'] == 'inner2' and abs(p['width'] - .1016) < 1e-8
    for a, b in zip(expected[:-1], expected[1:]):
        start, end = (100 + a[0], 100 - a[1]), (100 + b[0], 100 - b[1])
        matches = [t for t in board.GetTracks() if not isinstance(t, pcbnew.PCB_VIA)
                   and t.GetLayer() == pcbnew.In2_Cu and t.GetNetname() == 'DDR_1V5'
                   and ((near((pcbnew.ToMM(t.GetStart().x), pcbnew.ToMM(t.GetStart().y)), start)
                         and near((pcbnew.ToMM(t.GetEnd().x), pcbnew.ToMM(t.GetEnd().y)), end))
                        or (near((pcbnew.ToMM(t.GetStart().x), pcbnew.ToMM(t.GetStart().y)), end)
                            and near((pcbnew.ToMM(t.GetEnd().x), pcbnew.ToMM(t.GetEnd().y)), start)))]
        assert len(matches) == 1, 'The authored inner2 bridge must survive native export exactly'
        assert abs(pcbnew.ToMM(matches[0].GetWidth()) - .1016) < 1e-6
        bridge_tracks.append(matches[0])


records = []
for escape in escapes:
    metadata = escape['localEscapeMetadata']
    pin = metadata['pin'].removeprefix('pin')
    net = metadata['net']
    pad = next(p for p in ram.Pads() if p.GetNumber() == pin)
    assert pad.GetNetname() == net
    source_port = next(e for e in circuit if e['type'] == 'source_port'
                       and e['source_component_id'] == ram_source['source_component_id']
                       and e['pin_number'] == int(pin))
    assert source_port['name'] == metadata['ball']
    pcb_port = next(e for e in circuit if e['type'] == 'pcb_port'
                    and e['source_port_id'] == source_port['source_port_id'])
    assert near(mm_point(pad), (100 + pcb_port['x'], 100 - pcb_port['y']))
    native_via = next(p for p in escape['route'] if p['route_type'] == 'via')
    expected = (100 + native_via['x'], 100 - native_via['y'])
    via = next(t for t in board.GetTracks() if isinstance(t, pcbnew.PCB_VIA)
               and near(mm_point(t), expected))
    assert via.GetNetname() == net
    assert via.TopLayer() == pcbnew.F_Cu and via.BottomLayer() == pcbnew.B_Cu
    for layer in (pcbnew.F_Cu, pcbnew.In1_Cu, pcbnew.In2_Cu, pcbnew.B_Cu):
        assert abs(pcbnew.ToMM(via.GetWidth(layer)) - .4572) < 1e-6
    assert abs(pcbnew.ToMM(via.GetDrillValue()) - .254) < 1e-6
    connected = {i.m_Uuid.AsString() for i in connectivity.GetConnectedItems(pad)}
    assert via.m_Uuid.AsString() in connected, f'{metadata["ball"]}: expected via disconnected'
    assert zones[net].m_Uuid.AsString() in connected, f'{metadata["ball"]}: reference plane disconnected'
    directly_in_plane = zones[net].HitTestFilledArea(zones[net].GetLayer(), via.GetPosition())
    if power_bridge and metadata['ball'] == 'D2':
        assert net == 'DDR_1V5'
        assert all(t.m_Uuid.AsString() in connected for t in bridge_tracks), 'D2 must connect through all three bridge segments to the actual plane'
    else:
        assert directly_in_plane
    records.append({'ball': metadata['ball'], 'numericPin': int(pin), 'net': net,
                    'referenceLayer': metadata['layer'], 'connected': True,
                    'directlyInPlane': directly_in_plane,
                    **({'explicitInnerPowerBridge': True} if power_bridge and metadata['ball'] == 'D2' else {})})

assert len(records) == 39
assert sum(r['net'] == 'DDR_1V5' for r in records) == 18
assert sum(r['net'] == 'GND' for r in records) == 21
bypass_records = []
assert len(loops) == 14
for loop in loops:
    capacitor_source = next(c for c in components if c['name'] == loop['capacitor'])
    capacitance = capacitor_source['capacitance']
    expected_capacitance = 22e-6 if 'BULK' in loop['capacitor'] else 100e-9
    assert abs(capacitance - expected_capacitance) < 1e-12
    footprint = next(f for f in board.GetFootprints() if f.GetReference() == loop['capacitor'])
    for pin, terminal, net in [('1', 'power', 'DDR_1V5'), ('2', 'ground', 'GND')]:
        pad = next(p for p in footprint.Pads() if p.GetNumber() == pin)
        assert pad.GetNetname() == net
        sp = next(e for e in circuit if e['type'] == 'source_port'
                  and e['source_component_id'] == capacitor_source['source_component_id']
                  and e['pin_number'] == int(pin))
        pp = next(e for e in circuit if e['type'] == 'pcb_port'
                  and e['source_port_id'] == sp['source_port_id'])
        assert near(mm_point(pad), (100 + pp['x'], 100 - pp['y']))
        planned = loop[terminal]
        via = next(t for t in board.GetTracks() if isinstance(t, pcbnew.PCB_VIA)
                   and near(mm_point(t), (100 + planned['x'], 100 - planned['y'])))
        assert via.GetNetname() == net
        assert via.TopLayer() == pcbnew.F_Cu and via.BottomLayer() == pcbnew.B_Cu
        for layer in (pcbnew.F_Cu, pcbnew.In1_Cu, pcbnew.In2_Cu, pcbnew.B_Cu):
            assert abs(pcbnew.ToMM(via.GetWidth(layer)) - .4572) < 1e-6
        assert abs(pcbnew.ToMM(via.GetDrillValue()) - .254) < 1e-6
        connected = {i.m_Uuid.AsString() for i in connectivity.GetConnectedItems(pad)}
        assert via.m_Uuid.AsString() in connected, f'{loop["capacitor"]}: expected via disconnected'
        assert zones[net].m_Uuid.AsString() in connected, f'{loop["capacitor"]}: plane disconnected'
        assert zones[net].HitTestFilledArea(zones[net].GetLayer(), via.GetPosition())
        bypass_records.append({'capacitor': loop['capacitor'], 'numericPin': int(pin),
                               'net': net, 'side': loop['side'], 'connected': True})
assert len(bypass_records) == 28
report = {
    'status': 'RAM_REFERENCE_AND_BYPASS_COPPER_CONNECTIVITY_PASS_HOST_INCOMPLETE',
    'board': {'path': str(board_path), 'sha256': hashlib.sha256(board_path.read_bytes()).hexdigest()},
    'source': {'path': str(circuit_path), 'sha256': hashlib.sha256(circuit_path.read_bytes()).hexdigest()},
    'referenceLayout': {'path': str(escape_path), 'sha256': hashlib.sha256(escape_path.read_bytes()).hexdigest()},
    'copperLayerCount': 4, 'ramSupplyBallsConnectedToDdrPlane': 18,
    'ramGroundBallsConnectedToGroundPlane': 21, 'ramBypassCapacitorsConnectedToPlanes': 14,
    'ramBypassTerminalsConnectedToPlanes': 28, 'records': records, 'bypassRecords': bypass_records,
    **({'explicitInnerPowerBridge': {'ball': 'D2', 'connectedNativeSegments': len(bridge_tracks), 'newHoles': 0}} if power_bridge else {}),
    'fabricationReady': False, 'completeHostPowerRouting': False,
    'scope': 'All RAM supply/ground balls and 14 RAM bypass capacitors to filled reference planes through actual 18/10mil vias. '
             'Does not qualify effective capacitance, CPU supply routing, DDR signals or the complete handheld.'
}
report_path.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k not in ['records', 'bypassRecords']}))
