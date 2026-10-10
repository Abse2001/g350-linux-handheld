"""Create a fresh-fill trial with a wider real Inner2 GND neck; no rule waiver."""
import sys, json, hashlib, shutil
from pathlib import Path
from collections import Counter
import wx
wx.Log.SetLogLevel(wx.LOG_Error)
app = wx.App(False)
import pcbnew

source, root = map(Path, sys.argv[1:3])
minimum = float(sys.argv[3])
assert source.is_file() and not root.exists() and .1016 < minimum <= .2
shutil.copytree(source.parent, root / 'filled')
board = pcbnew.LoadBoard(str(source.resolve()))
assert board.GetCopperLayerCount() == 4
def geometry(item):
    if isinstance(item, pcbnew.PCB_VIA):
        return ('via', item.GetNetCode(), item.GetPosition().x, item.GetPosition().y,
                item.GetWidth(pcbnew.F_Cu), item.GetDrill(), item.TopLayer(), item.BottomLayer())
    assert type(item) == pcbnew.PCB_TRACK
    return ('wire', item.GetNetCode(), item.GetLayer(), item.GetStart().x, item.GetStart().y,
            item.GetEnd().x, item.GetEnd().y, item.GetWidth())
before = Counter(geometry(t) for t in board.GetTracks())
placements = [(f.m_Uuid.AsString(), f.GetPosition().x, f.GetPosition().y,
               f.GetOrientationDegrees(), f.GetLayer()) for f in board.GetFootprints()]
zones = [z for z in board.Zones() if not z.GetIsRuleArea() and z.GetLayer() == pcbnew.In2_Cu]
assert len(zones) == 1 and zones[0].GetNetname() == 'GND'
old = pcbnew.ToMM(zones[0].GetMinThickness())
assert abs(old - .1016) < 1e-9
zones[0].SetMinThickness(pcbnew.FromMM(minimum))
assert Counter(geometry(t) for t in board.GetTracks()) == before
assert placements == [(f.m_Uuid.AsString(), f.GetPosition().x, f.GetPosition().y,
                       f.GetOrientationDegrees(), f.GetLayer()) for f in board.GetFootprints()]
out = root / 'filled' / source.name
pcbnew.SaveBoard(str(out.resolve()), board)
shutil.copyfile(Path(__file__), root / 'minimum-neck.executed.py')
report = dict(source=str(source), sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
              board=str(out), layer='inner2', net='GND', previousMinimumNeckMm=old,
              minimumNeckMm=minimum, allTracksBarrelsAndPlacementsExactlyPreserved=True,
              clearanceAndRuleSeveritiesUnchanged=True, freshRefillAndAllChecksRequired=True,
              planningOnly=True, fabricationReady=False)
(root / 'minimum-neck-preparation.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
