"""Export actual KiCad-filled GND copper for targeted connectivity routing."""
import json
import sys
from pathlib import Path
import wx
wx.Log.SetLogLevel(wx.LOG_Error)
app=wx.App(False)
import pcbnew
board=pcbnew.LoadBoard(str(Path(sys.argv[1]).resolve()))
out=Path(sys.argv[2]); assert not out.exists()
result=[]
def points(chain):
    return [[pcbnew.ToMM(chain.CPoint(i).x)-100,100-pcbnew.ToMM(chain.CPoint(i).y)] for i in range(chain.PointCount())]
for zone in board.Zones():
    if zone.GetIsRuleArea() or zone.GetNetname()!='GND': continue
    for layer,name in [(pcbnew.F_Cu,'top'),(pcbnew.In1_Cu,'inner1'),(pcbnew.In2_Cu,'inner2'),(pcbnew.B_Cu,'bottom')]:
        if not zone.IsOnLayer(layer): continue
        poly=zone.GetFilledPolysList(layer)
        for i in range(poly.OutlineCount()):
            result.append(dict(layer=name,outline=points(poly.COutline(i)),holes=[points(poly.CHole(i,j)) for j in range(poly.HoleCount(i))]))
out.write_text(json.dumps(result)+'\n')
print('Filled ground regions:',len(result))
