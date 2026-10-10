"""Apply exact planar-only source deltas to a NEW CAD diagnostic, never qualify source."""
import sys,json,shutil,hashlib
from pathlib import Path
from collections import Counter,defaultdict
import wx
wx.Log.SetLogLevel(wx.LOG_Error);app=wx.App(False)
import pcbnew
board_path,old_path,new_path,root=map(Path,sys.argv[1:5]);assert not root.exists()
old=json.loads(old_path.read_text());new=json.loads(new_path.read_text())
for typ in ['source_trace','source_bus','source_port','source_net','source_component','pcb_board','pcb_port','pcb_smtpad','pcb_component','pcb_via','pcb_hole','pcb_plated_hole']:
 assert [e for e in old if e['type']==typ]==[e for e in new if e['type']==typ],typ
shutil.copytree(board_path.parent,root/'filled');board=pcbnew.LoadBoard(str(board_path.resolve()));assert board.GetCopperLayerCount()==4
layers={'top':pcbnew.F_Cu,'inner1':pcbnew.In1_Cu,'inner2':pcbnew.In2_Cu,'bottom':pcbnew.B_Cu}
def points(x1,y1,x2,y2):
 p=sorted([(x1,y1),(x2,y2)]);return tuple(p[0]+p[1])
def descriptor(p,q):
 return (layers[p['layer']],pcbnew.FromMM(p['width']),*points(pcbnew.FromMM(100+p['x']),pcbnew.FromMM(100-p['y']),pcbnew.FromMM(100+q['x']),pcbnew.FromMM(100-q['y'])))
def edges(t):return Counter(descriptor(p,q) for p,q in zip(t['route'],t['route'][1:]) if p['route_type']==q['route_type']=='wire' and p.get('layer')==q.get('layer') and (p['x'],p['y'])!=(q['x'],q['y']))
def track_descriptor(t):return (t.GetLayer(),t.GetWidth(),*points(t.GetStart().x,t.GetStart().y,t.GetEnd().x,t.GetEnd().y))
original=Counter(track_descriptor(t) for t in board.GetTracks() if type(t)==pcbnew.PCB_TRACK)
original_vias=Counter((t.GetNetCode(),t.GetPosition().x,t.GetPosition().y,t.GetDrill(),t.GetWidth(pcbnew.F_Cu),t.TopLayer(),t.BottomLayer()) for t in board.GetTracks() if isinstance(t,pcbnew.PCB_VIA))
placements=[(f.m_Uuid.AsString(),f.GetPosition().x,f.GetPosition().y,f.GetOrientationDegrees(),f.GetLayer()) for f in board.GetFootprints()]
pool=defaultdict(list)
for t in board.GetTracks():
 if type(t)==pcbnew.PCB_TRACK:
  desc=track_descriptor(t);pool[(desc[0],desc[1],*[round(v/1000) for v in desc[2:]])].append(t)
changed=[];removed_actual=[];added_actual=[]
for a in old:
 if a['type']!='pcb_trace':continue
 b=next(e for e in new if e.get('pcb_trace_id')==a['pcb_trace_id']);assert a['source_trace_id']==b['source_trace_id']
 if a['route']==b['route']:continue
 st=next(e for e in old if e.get('source_trace_id')==a['source_trace_id'] and e['type']=='source_trace')
 assert [p for p in a['route'] if p['route_type']=='via']==[p for p in b['route'] if p['route_type']=='via']
 # Fresh pours renumber their derived ownership tags. Numeric endpoints and
 # every physical/port field still must match exactly, as in the source guard.
 endpoint=lambda p:{k:v for k,v in p.items() if k not in ('copper_pour_id','is_inside_copper_pour')}
 assert [endpoint(a['route'][0]),endpoint(a['route'][-1])]==[endpoint(b['route'][0]),endpoint(b['route'][-1])]
 removed=edges(a)-edges(b);added=edges(b)-edges(a)
 # Cached annotations and sub-nanometre floating serialization can differ
 # without changing any physical CAD edge. Only real copper deltas are applied.
 if not removed and not added:continue
 assert st['name'].startswith('DDR_'), 'Foreign copper changed: '+st['name']
 assert removed and added
 matches=[];net=None
 for desc,num in removed.items():
  # Probe nearby micrometre buckets, then require <=1 nm exact serialization.
  from itertools import product
  candidates=[]
  key=(desc[0],desc[1],*[round(v/1000) for v in desc[2:]])
  for offset in product([-1,0,1],repeat=4):
   for t in pool[(key[0],key[1],*[x+y for x,y in zip(key[2:],offset)])]:
    actual=track_descriptor(t)
    if max(abs(x-y) for x,y in zip(actual[2:],desc[2:]))<=1:candidates.append(t)
  assert len(candidates)==num,(st['name'],desc,len(candidates),num)
  for t in candidates:
   if net is None:net=t.GetNetCode()
   assert net==t.GetNetCode();matches.append(t)
 for t in matches:
  desc=track_descriptor(t);pool[(desc[0],desc[1],*[round(v/1000) for v in desc[2:]])].remove(t);removed_actual.append(desc);board.Remove(t)
 for (layer,width,x1,y1,x2,y2),num in added.items():
  for _ in range(num):
   t=pcbnew.PCB_TRACK(board);t.SetLayer(layer);t.SetWidth(width);t.SetStart(pcbnew.VECTOR2I(x1,y1));t.SetEnd(pcbnew.VECTOR2I(x2,y2));t.SetNetCode(net);board.Add(t);added_actual.append(track_descriptor(t))
 changed.append(dict(name=st['name'],removedEdges=sum(removed.values()),addedEdges=sum(added.values())))
assert Counter(track_descriptor(t) for t in board.GetTracks() if type(t)==pcbnew.PCB_TRACK)==original-Counter(removed_actual)+Counter(added_actual)
assert original_vias==Counter((t.GetNetCode(),t.GetPosition().x,t.GetPosition().y,t.GetDrill(),t.GetWidth(pcbnew.F_Cu),t.TopLayer(),t.BottomLayer()) for t in board.GetTracks() if isinstance(t,pcbnew.PCB_VIA))
assert placements==[(f.m_Uuid.AsString(),f.GetPosition().x,f.GetPosition().y,f.GetOrientationDegrees(),f.GetLayer()) for f in board.GetFootprints()]
out=root/'filled'/board_path.name;pcbnew.SaveBoard(str(out.resolve()),board);shutil.copyfile(__file__,root/'planar-cad-diagnostic.executed.py')
h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
(root/'preparation.json').write_text(json.dumps(dict(sourceBoard={'path':str(board_path),'sha256':h(board_path)},oldCircuit={'path':str(old_path),'sha256':h(old_path)},newCircuit={'path':str(new_path),'sha256':h(new_path)},changed=changed,allOtherCopperViasAndPlacementsPreserved=True,planningOnly=True,freshSourceExportStillRequired=True,fabricationReady=False),indent=2)+'\n')
