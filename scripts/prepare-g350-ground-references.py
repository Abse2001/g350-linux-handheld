"""Create fresh outer ground reference zones around the locked DDR candidate."""
import sys
import json
import hashlib
from pathlib import Path
import wx
wx.Log.SetLogLevel(wx.LOG_Error)
app = wx.App(False)
import pcbnew
board_path, source_path, root = map(Path, sys.argv[1:4])
assert all(flag=='--all-layers' for flag in sys.argv[4:])
assert not root.exists()
root.mkdir()
board = pcbnew.LoadBoard(str(board_path.resolve()))
source = json.loads(source_path.read_text())
outline = next(s['outline'] for s in source if s['type'] == 'pcb_board')
assert board.GetCopperLayerCount() == 4
assert not any(not z.GetIsRuleArea() for z in board.Zones())
ground = board.FindNet('GND')
assert ground.GetNetCode() != 0
layer_names=['top','bottom']
zone_layers=(pcbnew.F_Cu,pcbnew.B_Cu)
if '--all-layers' in sys.argv[4:]:
    layer_names=['top','inner1','inner2','bottom']
    zone_layers=(pcbnew.F_Cu,pcbnew.In1_Cu,pcbnew.In2_Cu,pcbnew.B_Cu)
for layer in zone_layers:
    zone = pcbnew.ZONE(board)
    zone.SetLayer(layer)
    zone.SetNetCode(ground.GetNetCode())
    zone.SetLocalClearance(pcbnew.FromMM(.12))
    zone.SetMinThickness(pcbnew.FromMM(.1016))
    zone.SetPadConnection(pcbnew.ZONE_CONNECTION_FULL)
    polygon = zone.Outline()
    polygon.NewOutline()
    for p in outline:
        polygon.Append(pcbnew.FromMM(100 + p['x']), pcbnew.FromMM(100 - p['y']))
    # Match the authored reference margin and leave room for polygon/arc
    # discretization: the native board minimum remains 0.30 mm.
    polygon.Inflate(-pcbnew.FromMM(.35), pcbnew.CORNER_STRATEGY_ALLOW_ACUTE_CORNERS, pcbnew.FromMM(.001))
    assert polygon.OutlineCount()==1 and polygon.COutline(0).PointCount()>=3
    board.Add(zone)
path = root / 'ground-reference.kicad_pcb'
pcbnew.SaveBoard(str(path.resolve()), board)
report = {'sourceBoardSha256': hashlib.sha256(board_path.read_bytes()).hexdigest(), 'board': str(path), 'newReferenceLayers': layer_names, 'net': 'GND', 'clearanceMm': .12, 'minimumNeckMm': .1016, 'boardEdgeMarginMm': .35, 'padConnection': 'solid', 'requiresFreshFillAndConnectivityChecks': True, 'returnPathsAndAssemblyQualified': False, 'fabricationReady': False}
(root / 'preparation.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
