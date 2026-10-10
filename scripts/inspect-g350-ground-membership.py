"""Inventory actual GND membership for repair planning, without editing copper."""
import json,sys
from pathlib import Path
import wx
wx.Log.SetLogLevel(wx.LOG_Error)
app=wx.App(False)
import pcbnew
board_path,output=map(Path,sys.argv[1:3]);assert not output.exists()
b=pcbnew.LoadBoard(str(board_path.resolve()))
pads=[p for f in b.GetFootprints() for p in f.Pads() if p.GetNetname()=='GND']
cpu=[p for p in pads if p.GetParentFootprint().GetReference()=='U_SOC']
assert cpu and all(p.GetNumber().isdigit() for p in cpu)
seed=min(cpu,key=lambda p:int(p.GetNumber()))
connected={e.m_Uuid.AsString() for e in b.GetConnectivity().GetConnectedItems(seed)}|{seed.m_Uuid.AsString()}
position=lambda e:dict(x=pcbnew.ToMM(e.GetPosition().x)-100,y=100-pcbnew.ToMM(e.GetPosition().y))
rows=[dict(kind='pad',reference=p.GetParentFootprint().GetReference(),pin=p.GetNumber(),layer='top' if p.GetLayer()==pcbnew.F_Cu else 'bottom',uuid=p.m_Uuid.AsString(),mainGroundConnected=p.m_Uuid.AsString() in connected,**position(p)) for p in pads]
rows.extend(dict(kind='via',uuid=v.m_Uuid.AsString(),mainGroundConnected=v.m_Uuid.AsString() in connected,**position(v)) for v in b.GetTracks() if isinstance(v,pcbnew.PCB_VIA) and v.GetNetname()=='GND')
output.write_text(json.dumps({'board':str(board_path),'seed':'U_SOC.pin'+seed.GetNumber(),'items':rows,'planningOnly':True},indent=2)+'\n')
print(json.dumps({'groundItems':len(rows),'unconnectedGroundPads':sum(r['kind']=='pad' and not r['mainGroundConnected'] for r in rows)}))
