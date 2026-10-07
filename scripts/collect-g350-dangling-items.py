"""Resolve actual DRC UUIDs to copper geometry for conservative source pruning."""
import hashlib
import json
import sys
from pathlib import Path
import wx
wx.Log.SetLogLevel(wx.LOG_Error)
app = wx.App(False)
import pcbnew

board_path, drc_path, output = map(Path, sys.argv[1:4])
assert not output.exists()
board = pcbnew.LoadBoard(str(board_path.resolve()))
drc = json.loads(drc_path.read_text())
ids = {item['uuid']: violation['type'] for violation in drc['violations'] if violation['type'] in ('via_dangling', 'track_dangling') for item in violation['items']}
items = []
def xy(point):
    return dict(x=pcbnew.ToMM(point.x)-100, y=100-pcbnew.ToMM(point.y))
for track in board.GetTracks():
    uid = track.m_Uuid.AsString()
    if uid not in ids:
        continue
    via = isinstance(track, pcbnew.PCB_VIA)
    row = dict(uuid=uid, warning=ids[uid], net=track.GetNetname(), start=xy(track.GetStart()), end=xy(track.GetEnd()), layer=board.GetLayerName(track.GetLayer()), width=pcbnew.ToMM(track.GetWidth(pcbnew.F_Cu) if via else track.GetWidth()), type='via' if via else 'track')
    if not via:
        position = pcbnew.VECTOR2I()
        assert board.GetConnectivity().TestTrackEndpointDangling(track, False, position), uid
        row['danglingPoint'] = xy(position)
    items.append(row)
assert len(items) == len(ids), (len(items), len(ids))
assert len({i['uuid'] for i in items}) == len(items)
output.write_text(json.dumps(items, indent=2)+'\n')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
report = dict(boardSha256=sha(board_path), drcSha256=sha(drc_path), itemsSha256=sha(output), items=len(items), vias=sum(i['type']=='via' for i in items), tracks=sum(i['type']=='track' for i in items), fabricationReady=False)
Path(str(output)+'.collection.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report))
