"""Check numeric CPU/RAM pads through actual vias into filled KiCad planes."""
from pathlib import Path
import hashlib
import json
import math
import sys

import wx
wx.Log.SetLogLevel(wx.LOG_Error)
application = wx.App(False)
import pcbnew

board_path, circuit_path, report_path = map(Path, sys.argv[1:4])
ram_only = '--ram-only' in sys.argv[4:]
with_dqs0 = '--dqs0' in sys.argv[4:]
with_byte0 = '--byte0' in sys.argv[4:]
with_byte1_escapes = '--byte1-escapes' in sys.argv[4:]
assert sum([ram_only, with_dqs0, with_byte0, with_byte1_escapes]) <= 1
circuit = json.loads(circuit_path.read_text())
board = pcbnew.LoadBoard(str(board_path.resolve()))
assert board.GetCopperLayerCount() == 4
footprints = {f.GetReference(): f for f in board.GetFootprints()}
assert len(list(footprints['U_SOC'].Pads())) == 324
assert len(list(footprints['U_RAM'].Pads())) == 96
connectivity = board.GetConnectivity()
vias = [t for t in board.GetTracks() if isinstance(t, pcbnew.PCB_VIA)]
assert len(vias) == (39 if ram_only else 141 if with_byte1_escapes else 119 if with_byte0 else 101 if with_dqs0 else 97)
signal_reference_paths = []
if with_dqs0 or with_byte0 or with_byte1_escapes:
    signal_vias = [v for v in vias if v.GetNetname() not in ['GND', 'DDR_1V5']]
    assert len(signal_vias) == (44 if with_byte1_escapes else 22 if with_byte0 else 4)
    # Unlabelled port-to-port traces can have generated export net names.
    # Check their electrical net codes against the actual numeric CPU pads.
    if with_byte0 or with_byte1_escapes:
        map_path = Path('lib/am3352/memory-byte1-top-centered-swizzled-connections.json')
        mapping = json.loads(map_path.read_text())
        names = {'DDR_D' + str(i) for i in range(8)} | {'DDR_DQM0', 'DDR_DQS0', 'DDR_DQSn0'}
        if with_byte1_escapes:
            names |= {'DDR_D' + str(i) for i in range(8, 16)} | {'DDR_DQM1', 'DDR_DQS1', 'DDR_DQSn1'}
        signals = [s for s in mapping if s['name'] in names]
        assert len(signals) == (22 if with_byte1_escapes else 11) and {s['name'] for s in signals} == names
        pins = [s['socPin'].removeprefix('pin') for s in signals]
        signal_reference_paths.append(map_path)
    else:
        pins = ['14', '32']
    signal_net_codes = [next(p for p in footprints['U_SOC'].Pads() if p.GetNumber() == pin).GetNetCode() for pin in pins]
    assert len(set(signal_net_codes)) == len(pins) and all(signal_net_codes)
    assert sorted(v.GetNetCode() for v in signal_vias) == sorted(signal_net_codes * 2)
    assert all(v.TopLayer() == pcbnew.F_Cu and v.BottomLayer() == pcbnew.B_Cu for v in signal_vias)
    for via in signal_vias:
        assert abs(pcbnew.ToMM(via.GetDrillValue()) - .254) < 1e-6
        for layer in (pcbnew.F_Cu, pcbnew.In1_Cu, pcbnew.In2_Cu, pcbnew.B_Cu):
            assert abs(pcbnew.ToMM(via.GetWidth(layer)) - .4572) < 1e-6
zones = {z.GetNetname(): z for z in board.Zones() if z.GetNetname()}
assert set(zones) == {'GND', 'DDR_1V5'}
assert zones['GND'].GetLayer() == pcbnew.In1_Cu
assert zones['DDR_1V5'].GetLayer() == pcbnew.In2_Cu
for zone in zones.values():
    assert zone.IsFilled()
    assert zone.GetFilledPolysList(zone.GetLayer()).OutlineCount() == 1, 'Reference plane has disconnected islands'


def position(item):
    p = item.GetPosition()
    return pcbnew.ToMM(p.x), pcbnew.ToMM(p.y)


def near(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-5


records = []
cache_paths = signal_reference_paths[:]
for name, map_path, cache_path, expected in [
    ('U_RAM', 'lib/am3352/ram-ball-map.json', 'lib/am3352/placement/ddr-ram-power-fanout.json', 39),
    *([] if ram_only else [('U_SOC', 'lib/am3352/cpu-ball-map.json', 'lib/am3352/placement/ddr-cpu-power-fanout-repaired.json', 62)]),
]:
    mapping = json.loads(Path(map_path).read_text())['pins']
    cache = json.loads(Path(cache_path).read_text())
    cache_paths.extend([Path(map_path), Path(cache_path)])
    assert len(cache) == expected
    source = next(e for e in circuit if e['type'] == 'source_component' and e['name'] == name)
    ports = [e for e in circuit if e['type'] == 'source_port' and e['source_component_id'] == source['source_component_id']]
    checked = set()
    for escape in cache:
        pin = int(escape['connection'].split('.pin')[1])
        assert escape['connection'].startswith(name + '.pin')
        port = next(e for e in ports if e['pin_number'] == pin)
        fn = mapping[port['name']]
        if name == 'U_RAM':
            assert fn.startswith(('VDD', 'VSS'))
            net = 'GND' if fn.startswith('VSS') else 'DDR_1V5'
            limit = 1.524
        else:
            assert fn == 'VDDS_DDR' or fn.startswith('VSS') or fn in ['RTC_KALDO_ENn', 'VDDA_ADC', 'VREFP', 'VREFN'] or fn.startswith('AIN')
            net = 'DDR_1V5' if fn == 'VDDS_DDR' else 'GND'
            limit = 1.778
        traces = [e for e in circuit if e['type'] == 'source_trace' and port['source_port_id'] in e['connected_source_port_ids']]
        assert any(len(t['connected_source_port_ids']) == 1 and any(n['name'] == net and n['source_net_id'] in t['connected_source_net_ids'] for n in circuit if n['type'] == 'source_net') for t in traces)
        pcb_port = next(e for e in circuit if e['type'] == 'pcb_port' and e['source_port_id'] == port['source_port_id'])
        pad = next(p for p in footprints[name].Pads() if p.GetNumber() == str(pin))
        assert pad.GetNetname() == net
        assert near(position(pad), (100 + pcb_port['x'], 100 - pcb_port['y']))
        route = escape['route']
        assert near((route[0]['x'], route[0]['y']), (pcb_port['x'], pcb_port['y']))
        sites = [p for p in route if p['route_type'] == 'via']
        assert len(sites) <= 1
        endpoint = sites[0] if sites else route[-1]
        matches = [v for v in vias if near(position(v), (100 + endpoint['x'], 100 - endpoint['y']))]
        assert len(matches) == 1, 'Missing or duplicated physical native via'
        via = matches[0]
        assert via.GetNetname() == net
        assert via.TopLayer() == pcbnew.F_Cu and via.BottomLayer() == pcbnew.B_Cu
        assert abs(pcbnew.ToMM(via.GetDrillValue()) - .254) < 1e-6
        for layer in (pcbnew.F_Cu, pcbnew.In1_Cu, pcbnew.In2_Cu, pcbnew.B_Cu):
            assert abs(pcbnew.ToMM(via.GetWidth(layer)) - .4572) < 1e-6
        connected = {i.m_Uuid.AsString() for i in connectivity.GetConnectedItems(pad)}
        assert via.m_Uuid.AsString() in connected, f'{name}.{port["name"]}: disconnected from its native via'
        assert zones[net].m_Uuid.AsString() in connected, f'{name}.{port["name"]}: disconnected from filled reference plane'
        assert zones[net].HitTestFilledArea(zones[net].GetLayer(), via.GetPosition())
        length = sum(math.hypot(b['x'] - a['x'], b['y'] - a['y']) for a, b in zip(route, route[1:]) if a['route_type'] == b['route_type'] == 'wire' and a['layer'] == b['layer'])
        assert length <= limit + 1e-8
        checked.add(pin)
        records.append(dict(package=name, ball=port['name'], function=fn, numericPin=pin, net=net, via=dict(x=endpoint['x'], y=endpoint['y']), connectedToFilledPlane=True, sharedExistingVia=not sites, padToViaLengthMm=length, limitMm=limit))
    assert len(checked) == expected
assert sum(r['package'] == 'U_RAM' and r['net'] == 'GND' for r in records) == 21
assert sum(r['package'] == 'U_RAM' and r['net'] == 'DDR_1V5' for r in records) == 18
if not ram_only:
    assert sum(r['package'] == 'U_SOC' and r['net'] == 'GND' for r in records) == 55
    assert sum(r['package'] == 'U_SOC' and r['net'] == 'DDR_1V5' for r in records) == 7


def artifact(path):
    return dict(path=str(path), sha256=hashlib.sha256(path.read_bytes()).hexdigest())


report = dict(status='PASS_NUMERIC_PAD_VIA_FILLED_PLANE_CONNECTIVITY', board=artifact(board_path), circuit=artifact(circuit_path), referenceSources=[artifact(p) for p in cache_paths], checkedPackageTerminals=len(records), physicalThroughVias=len(vias), copperLayers=4, bothReferencePlanesContinuous=True, padToViaLengthsWithinTiLimits=True, records=records, fabricationReady=False, ddrSignalsQualified=0, bypassCapacitorsRouted=False, scope='Only the selected CPU/RAM ground and DDR supply escapes into their filled planes. Bypass loops, other voltage domains, signal routing, timing and complete handheld qualification remain unfinished.')
report_path.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['status', 'checkedPackageTerminals', 'physicalThroughVias', 'bothReferencePlanesContinuous', 'padToViaLengthsWithinTiLimits']}))
