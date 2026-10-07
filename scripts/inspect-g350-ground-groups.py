"""Inspect real numeric GND pad groups on a freshly filled KiCad board."""
import json,sys,hashlib
from pathlib import Path
import wx
wx.Log.SetLogLevel(wx.LOG_Error)
app=wx.App(False)
import pcbnew
path,out=map(Path,sys.argv[1:3]);assert not out.exists()
b=pcbnew.LoadBoard(str(path.resolve()));conn=b.GetConnectivity()
pads=[p for f in b.GetFootprints() for p in f.Pads() if p.GetNetname()=="GND"]
groups=[];seen=set()
for pad in pads:
 uid=pad.m_Uuid.AsString()
 if uid in seen:continue
 linked={i.m_Uuid.AsString() for i in conn.GetConnectedItems(pad)}|{uid}
 members=[p for p in pads if p.m_Uuid.AsString() in linked];seen.update(p.m_Uuid.AsString() for p in members)
 groups.append(dict(pads=[dict(reference=p.GetParentFootprint().GetReference(),pin=p.GetNumber(),x=pcbnew.ToMM(p.GetPosition().x)-100,y=100-pcbnew.ToMM(p.GetPosition().y)) for p in members]))
groups.sort(key=lambda g:-len(g["pads"]))
out.write_text(json.dumps(dict(boardSha256=hashlib.sha256(path.read_bytes()).hexdigest(),groups=groups,fabricationReady=False),indent=2)+"\n")
print("Ground pad groups:",[len(g["pads"]) for g in groups])
