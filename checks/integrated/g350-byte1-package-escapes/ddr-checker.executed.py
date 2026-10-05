"""Verify actual DDR pad-to-pad copper with KiCad's connectivity engine."""
from pathlib import Path
import hashlib
import json
import sys
import wx
wx.Log.SetLogLevel(wx.LOG_Error)
application = wx.App(False)
import pcbnew

board_path, circuit_path, report_path = map(Path, sys.argv[1:4])
expected_count = int(sys.argv[4])
circuit = json.loads(circuit_path.read_text())
map_path = Path(sys.argv[5] if len(sys.argv) > 5 else 'lib/am3352/memory-byte1-swizzled-connections.json')
mapping = json.loads(map_path.read_text())
board = pcbnew.LoadBoard(str(board_path.resolve()))
assert board.GetCopperLayerCount() == 4
footprints = {f.GetReference(): f for f in board.GetFootprints()}
assert len(list(footprints['U_SOC'].Pads())) == 324
assert len(list(footprints['U_RAM'].Pads())) == 96
connectivity = board.GetConnectivity()
records = []
for signal in mapping:
    pads = []
    for name, pin_key, ball_key in [('U_SOC', 'socPin', 'socBall'), ('U_RAM', 'ramPin', 'ramBall')]:
        pin = int(signal[pin_key].removeprefix('pin'))
        component = next(e for e in circuit if e['type'] == 'source_component' and e['name'] == name)
        sp = next(e for e in circuit if e['type'] == 'source_port' and e['source_component_id'] == component['source_component_id'] and e['pin_number'] == pin)
        assert sp['name'] == signal[ball_key]
        pp = next(e for e in circuit if e['type'] == 'pcb_port' and e['source_port_id'] == sp['source_port_id'])
        pad = next(p for p in footprints[name].Pads() if p.GetNumber() == str(pin))
        pos = pad.GetPosition()
        assert abs(pcbnew.ToMM(pos.x) - 100 - pp['x']) < 1e-5
        assert abs(100 - pcbnew.ToMM(pos.y) - pp['y']) < 1e-5
        pads.append(pad)
    assert pads[0].GetNetCode() == pads[1].GetNetCode() != 0
    connected = {i.m_Uuid.AsString() for i in connectivity.GetConnectedItems(pads[0])}
    records.append({'name': signal['name'], 'socBall': signal['socBall'], 'ramBall': signal['ramBall'],
                    'connected': pads[1].m_Uuid.AsString() in connected})
count = sum(r['connected'] for r in records)
report = {'status': 'KICAD_DDR_PARTIAL_CONNECTIVITY_VERIFIED' if count == expected_count else 'KICAD_DDR_CONNECTIVITY_UNEXPECTED',
          'board': {'path': str(board_path), 'sha256': hashlib.sha256(board_path.read_bytes()).hexdigest()},
          'circuit': {'path': str(circuit_path), 'sha256': hashlib.sha256(circuit_path.read_bytes()).hexdigest()},
          'connectedSignals': count, 'requiredSignals': 49, 'expectedPartialCount': expected_count,
          'connectionMap': {'path': str(map_path), 'sha256': hashlib.sha256(map_path.read_bytes()).hexdigest()},
          'results': records, 'fabricationReady': False, 'timingQualified': False}
report_path.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'status': report['status'], 'connectedSignals': count, 'requiredSignals': 49}))
assert count == expected_count
