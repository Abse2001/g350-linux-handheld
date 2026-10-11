"""Experimental four-layer problem; only DDR may autoroute, on Top/Bottom."""
import json
import hashlib
from pathlib import Path
import sys
import re
import wx
wx.Log.SetLogLevel(wx.LOG_Error)
app = wx.App(False)
import pcbnew

board_path, circuit_path, srj_path, root = map(Path, sys.argv[1:5])
assert not root.exists()
root.mkdir()
board = pcbnew.LoadBoard(str(board_path.resolve()))
assert board.GetCopperLayerCount() == 4
source = json.loads(circuit_path.read_text())
srj = json.loads(srj_path.read_text())
ports = {p['pcb_port_id']: p for p in source if p['type'] == 'pcb_port'}
logical = {p['source_port_id']: p for p in source if p['type'] == 'source_port'}
components = {p['source_component_id']: p['name'] for p in source if p['type'] == 'source_component'}
footprints = {f.GetReference(): f for f in board.GetFootprints()}
placement_layers = {components[p['source_component_id']]: p['layer'] for p in source if p['type'] == 'pcb_component'}
corrected_parent_layers = []
for ref, fp in footprints.items():
    layer = pcbnew.F_Cu if placement_layers[ref] == 'top' else pcbnew.B_Cu
    if fp.GetLayer() != layer:
        before = [(p.GetNumber(), p.GetPosition().x, p.GetPosition().y, p.GetLayer(), p.GetOrientationDegrees()) for p in fp.Pads()]
        # The converter already puts the pads on the correct side. Change only
        # the footprint's parent metadata: flipping would move the actual pads.
        fp.SetLayer(layer)
        assert before == [(p.GetNumber(), p.GetPosition().x, p.GetPosition().y, p.GetLayer(), p.GetOrientationDegrees()) for p in fp.Pads()]
        corrected_parent_layers.append(ref)
pad_by_port = {}
for port_id, port in ports.items():
    p = logical[port['source_port_id']]
    fp = footprints[components[p['source_component_id']]]
    pad_by_port[port_id] = next(pad for pad in fp.Pads() if pad.GetNumber() == str(p['pin_number']))
ddr_codes = set()
for trace in [e for e in source if e['type']=='source_trace' and e.get('name','').startswith('DDR_')]:
    endpoints = [p for p in ports.values() if p['source_port_id'] in trace['connected_source_port_ids']]
    assert len(endpoints)==2
    codes = {pad_by_port[p['pcb_port_id']].GetNetCode() for p in endpoints}
    assert len(codes)==1 and 0 not in codes
    ddr_codes.update(codes)
assert len(ddr_codes)==49
required_source_ports = {p for e in source if e['type']=='source_trace' for p in e.get('connected_source_port_ids',[])}
required_ports = [p for p in ports.values() if p['source_port_id'] in required_source_ports]
assert len(required_source_ports)==len(required_ports)==1032
authored_pads = [p for p in source if p['type'] in ('pcb_smtpad','pcb_plated_hole')]
authored_holes=[p for p in source if p['type']=='pcb_hole']
physical_holes=[p for fp in board.GetFootprints() for p in fp.Pads() if p.GetAttribute()==pcbnew.PAD_ATTRIB_NPTH]
assert len(physical_holes)==len(authored_holes)==2
for hole in authored_holes:
    matching=[p for p in physical_holes if abs(pcbnew.ToMM(p.GetPosition().x)-100-hole['x'])<1e-5 and abs(100-pcbnew.ToMM(p.GetPosition().y)-hole['y'])<1e-5]
    assert len(matching)==1
    assert all(abs(pcbnew.ToMM(v)-hole['hole_diameter'])<1e-5 for v in (matching[0].GetDrillSize().x,matching[0].GetDrillSize().y))
assert sum(len(list(fp.Pads())) for fp in board.GetFootprints())==len(authored_pads)+len(authored_holes)
for port_id, port in ports.items():
    logical_port=logical[port['source_port_id']]
    matching=[p for p in footprints[components[logical_port['source_component_id']]].Pads() if p.GetNumber()==str(logical_port['pin_number'])]
    authored=[p for p in authored_pads if p.get('pcb_port_id')==port_id]
    assert len(matching)==len(authored), (port_id,'physical land count')
    contact=pcbnew.VECTOR2I(pcbnew.FromMM(100+port['x']),pcbnew.FromMM(100-port['y']))
    assert any(p.HitTest(contact) for p in matching),(port_id,'contact outside actual land')
widths = {}
for c in srj['connections']:
    codes = {pad_by_port[p['pcb_port_id']].GetNetCode() for p in c['pointsToConnect']}
    assert len(codes) == 1
    code = codes.pop()
    assert code != 0
    widths[code] = max(widths.get(code, .1016), c.get('width', .15))
classes = {}
for net in board.GetNetsByNetcode().values():
    if not net.GetNetCode():
        continue
    width = widths.get(net.GetNetCode(), .1016)
    if width not in classes:
        nc = pcbnew.NETCLASS('G350_width_' + str(width))
        nc.SetClearance(pcbnew.FromMM(.1016))
        nc.SetTrackWidth(pcbnew.FromMM(width))
        nc.SetViaDiameter(pcbnew.FromMM(.4572))
        nc.SetViaDrill(pcbnew.FromMM(.254))
        classes[width] = nc
    net.SetNetClass(classes[width])
for track in board.GetTracks():
    track.SetLocked(True)
for fp in board.GetFootprints():
    fp.SetLocked(True)
ds = board.GetDesignSettings()
ds.m_MinClearance = pcbnew.FromMM(.1016)
ds.m_HoleClearance = pcbnew.FromMM(.20)
ds.m_CopperEdgeClearance = pcbnew.FromMM(.30)
for name, nc in [(nc.GetName(), nc) for nc in classes.values()]:
    ds.m_NetSettings.GetNetclasses()[name] = nc
out_board = root / 'locked-ddr.kicad_pcb'
pcbnew.SaveBoard(str(out_board.resolve()), board)
dsn = root / 'board.dsn'
assert pcbnew.ExportSpecctraDSN(board, str(dsn.resolve()))
# KiCad's DSN exporter uses the project's default class even when the in-memory
# net objects have explicit classes. Encode the source widths and standard via
# in the exported network classes, without changing any pad or locked wire.
text = dsn.read_text()
# Freerouting 2.5 merges identical packages and renumbers KiCad's ::N image
# variants, while placement references retain their original names. Give each
# variant a stable unique name so a back-side land cannot resolve to a different
# mirrored variant. Copper, shapes, pin numbers and placements stay unchanged.
image_names = re.findall(r'\(image\s+("(?:[^"\\]|\\.)*"|[^\s()]+)', text)
renames = {}
for token in image_names:
    name = json.loads(token) if token.startswith('"') else token
    if re.search(r'::\d+$', name):
        renames[name] = re.sub(r'::(\d+)$', r'__G350_VARIANT_\1', name)
def rename_image(match):
    token = match.group(2)
    name = json.loads(token) if token.startswith('"') else token
    return match.group(1) + json.dumps(renames.get(name, name))
text = re.sub(r'(\((?:image|component)\s+)("(?:[^"\\]|\\.)*"|[^\s()]+)', rename_image, text)
standard_via = 'Via[0-3]_457.2:254_um'
assert standard_via in text
text, count = re.subn(r'\(via "Via\[0-3\]_600:300_um" "Via\[0-3\]_457\.2:254_um"\)',
                     '(via "' + standard_via + '")', text, count=1)
assert count == 1
text, count = re.subn(r'\(rule\s*\(width 200\)\s*\(clearance 200\)\s*\(clearance 50 \(type smd_smd\)\)\s*\)',
                     '(rule (width 150) (clearance 101.6) (clearance 150 (type smd_smd)) (clearance 254 (type via_via)) (clearance 300 (type wire_area)))', text, count=1)
assert count == 1
by_width = {}
for net in board.GetNetsByNetcode().values():
    if net.GetNetCode():
        width = widths.get(net.GetNetCode(), .1016)
        # The authored USB pair is restricted to the two outer layers.
        usb = net.GetNetname() in ('USB0_DP', 'USB0_DM')
        xtal = net.GetNetname() in ('XTAL_IN', 'XTAL_DRIVE')
        ddr = net.GetNetCode() in ddr_codes
        by_width.setdefault((width, usb, xtal, ddr), []).append(net.GetNetname())
network_classes = []
for (width, usb, xtal, ddr), nets in sorted(by_width.items()):
    quoted = ' '.join(json.dumps(n) for n in sorted(nets))
    allowed = ' (use_layer F.Cu B.Cu)' if usb or ddr else ' (use_layer F.Cu) (length 10000 0)' if xtal else ''
    suffix = '_DDR_outer' if ddr else '_USB_outer' if usb else '_XTAL_top' if xtal else ''
    network_classes.append(f'(class G350_width_{width}{suffix} {quoted} (circuit (use_via "{standard_via}"){allowed}) (rule (width {width * 1000:.4f}) (clearance 101.6) (clearance 254 (type via_via))))')
text, count = re.subn(r'\(class kicad_default[\s\S]*?\n    \)\n  \)\n  \(wiring',
                     '\n    '.join(network_classes) + '\n  )\n  (wiring', text, count=1)
assert count == 1
wire_paths = re.findall(r'\(wire\s*\(path\s+(\S+)\s+(\S+)\s+([\d.\-\s]+)\)', text)
# KiCad joins adjoining segments into multi-point paths. Count their edges,
# rather than their path records, to prove no locked copper was omitted.
wire_edges = sum(len(points.split()) // 2 - 1 for _, _, points in wire_paths)
via_records = len(re.findall(r'\(via "Via\[0-3\]_457\.2:254_um"\s+[\d.\-]+\s+[\d.\-]+\s+\(net', text))
assert wire_edges + via_records == len(list(board.GetTracks()))
assert text.count('(type fix)') == len(wire_paths) + via_records
dsn.write_text(text)
report = {'sourceBoard': str(board_path), 'sourceCircuit': str(circuit_path),
          'sourceCircuitSha256': hashlib.sha256(circuit_path.read_bytes()).hexdigest(),
          'dsnSha256': hashlib.sha256(dsn.read_bytes()).hexdigest(),
          'copperLayers': 4, 'lockedTrackAndViaRecords': len(list(board.GetTracks())),
          'correctedFootprintParentLayers': corrected_parent_layers,
          'actualPadPositionsAndLayersPreserved': True, 'viaLandClearanceMm': .254,
          'stableDsnImageVariantNames': renames,
          'lockedDsnWireEdges': wire_edges, 'lockedDsnViaRecords': via_records,
          'omittedTrackRecords': 0,
          'logicalDdrConnections':49,'requiredNumericSourcePorts':1032,'allLogicalPhysicalPorts':len(ports),'allPhysicalLandRecords':len(authored_pads),'preservedNonplatedGuideHoles':len(authored_holes),'ddrRoutingLayers':['F.Cu','B.Cu'],
          'completeDdrCarriersByInputMetadata':sum(1 for e in source if e['type']=='pcb_trace' and e.get('route') and e['route'][0].get('start_pcb_port_id') and e['route'][-1].get('end_pcb_port_id') and any(t['type']=='source_trace' and t.get('source_trace_id')==e.get('source_trace_id') and t.get('name','').startswith('DDR_') for t in source)),
          'remainingNets':len(widths),
          'routingWidthsMm': sorted(classes), 'clearanceMm': .1016,
          'viaLandMm': .4572, 'viaDrillMm': .254,
          'requiresNativeSourceAndIndependentChecks': True, 'fabricationReady': False}
(root / 'preparation.json').write_text(json.dumps(report, indent=2) + '\n')
(root / 'exporter.executed.py').write_text(Path(__file__).read_text())
print(json.dumps(report))
