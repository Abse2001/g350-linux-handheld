"""Check every required physical pad, not the capped KiCad ratsnest report."""
from pathlib import Path
import hashlib
import json
import sys
import wx
wx.Log.SetLogLevel(wx.LOG_Error)
app = wx.App(False)
import pcbnew

board_path, circuit_path, srj_path, report_path = map(Path, sys.argv[1:5])
assert not report_path.exists()
source = json.loads(circuit_path.read_text())
srj = json.loads(srj_path.read_text())
board = pcbnew.LoadBoard(str(board_path.resolve()))
assert board.GetCopperLayerCount() == 4
footprints = {f.GetReference(): f for f in board.GetFootprints()}
components = {s['source_component_id']: s['name'] for s in source if s['type'] == 'source_component'}
logical = {s['source_port_id']: s for s in source if s['type'] == 'source_port'}
physical = {s['pcb_port_id']: s for s in source if s['type'] == 'pcb_port'}
pads = {}
for pid, p in physical.items():
    sp = logical[p['source_port_id']]
    matching = [t for t in footprints[components[sp['source_component_id']]].Pads() if t.GetNumber() == str(sp['pin_number'])]
    authored = [s for s in source if s['type'] in ('pcb_smtpad', 'pcb_plated_hole') and s.get('pcb_port_id') == pid]
    assert len(matching) == len(authored), (pid, len(matching), len(authored))
    contact = pcbnew.VECTOR2I(pcbnew.FromMM(100 + p['x']), pcbnew.FromMM(100 - p['y']))
    # Polygonal inductor lands contain three overlapping physical pads with
    # one pin number. A logical port is inside their copper union, rather than
    # at the centroid of the first polygon. Check every physical pad below.
    assert any(t.HitTest(contact) for t in matching), (pid, 'logical contact outside physical copper')
    if len(matching) == 1 and matching[0].GetShape() != pcbnew.PAD_SHAPE_CUSTOM:
        actual = (pcbnew.ToMM(matching[0].GetPosition().x) - 100, 100 - pcbnew.ToMM(matching[0].GetPosition().y))
        assert abs(actual[0] - p['x']) < 1e-5 and abs(actual[1] - p['y']) < 1e-5, (pid, components[sp['source_component_id']], sp['pin_number'], actual, (p['x'], p['y']))
    pads[pid] = matching
conn = board.GetConnectivity()
rows = []
for c in srj['connections']:
    ps = [pad for p in c['pointsToConnect'] for pad in pads[p['pcb_port_id']]]
    assert len({p.GetNetCode() for p in ps}) == 1 and ps[0].GetNetCode() != 0
    linked = {i.m_Uuid.AsString() for i in conn.GetConnectedItems(ps[0])} | {ps[0].m_Uuid.AsString()}
    missing = [{'pcb_port_id': p['pcb_port_id'], 'reference': pad.GetParentFootprint().GetReference(), 'pin': pad.GetNumber(), 'physicalPadUuid': pad.m_Uuid.AsString()} for p in c['pointsToConnect'] for pad in pads[p['pcb_port_id']] if pad.m_Uuid.AsString() not in linked]
    rows.append({'connection': c['name'], 'net': ps[0].GetNetname(), 'requiredPads': len(ps), 'connected': not missing, 'missingPads': missing})
bad = [r for r in rows if not r['connected']]
result = {'boardSha256': hashlib.sha256(board_path.read_bytes()).hexdigest(), 'circuitSha256': hashlib.sha256(circuit_path.read_bytes()).hexdigest(), 'requiredConnections': len(rows), 'connectedConnections': len(rows) - len(bad), 'disconnectedConnections': len(bad), 'missingPadMemberships': sum(len(r['missingPads']) for r in bad), 'results': rows, 'fabricationReady': False}
report_path.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: v for k, v in result.items() if k != 'results'}))
assert not bad
