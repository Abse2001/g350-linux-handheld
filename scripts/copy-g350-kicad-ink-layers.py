"""Reuse checked assembly-marking layers without copying any board copper.

Both boards must have identical footprint references and graphic geometry. Changes
are limited to the previously checked Silk-to-Fab fields/outline segments.
"""
import hashlib,json,re,sys
from pathlib import Path
import pcbnew

reference_path,board_path=map(Path,sys.argv[1:3]);assert reference_path.resolve()!=board_path.resolve()
reference=pcbnew.LoadBoard(str(reference_path.resolve()));board=pcbnew.LoadBoard(str(board_path.resolve()))
old={fp.GetReference():fp for fp in reference.GetFootprints()};new={fp.GetReference():fp for fp in board.GetFootprints()}
assert set(old)==set(new) and len(new)==280
original=board_path.read_text();selected=set();graphic_ids=set();changes=[]
for name,fp in new.items():
 ref=old[name]
 a,b=fp.Reference(),ref.Reference()
 assert a.GetPosition()==b.GetPosition() and a.GetText()==b.GetText() and a.GetTextSize()==b.GetTextSize()
 assert a.GetTextAngle().AsDegrees()==b.GetTextAngle().AsDegrees() and a.IsVisible()==b.IsVisible()
 if a.GetLayer()!=b.GetLayer():
  assert (a.GetLayer(),b.GetLayer()) in [(pcbnew.F_SilkS,pcbnew.F_Fab),(pcbnew.B_SilkS,pcbnew.B_Fab)]
  selected.add(a.m_Uuid.AsString());a.SetLayer(b.GetLayer());changes.append(dict(reference=name,kind='reference',uuid=a.m_Uuid.AsString()))
 before=list(ref.GraphicalItems())
 for g in fp.GraphicalItems():
  if g.GetLayer() not in (pcbnew.F_SilkS,pcbnew.B_SilkS) or not isinstance(g,pcbnew.PCB_SHAPE):continue
  matched=[prior for prior in before if isinstance(prior,pcbnew.PCB_SHAPE) and (g.GetLayer(),prior.GetLayer()) in [(pcbnew.F_SilkS,pcbnew.F_Fab),(pcbnew.B_SilkS,pcbnew.B_Fab)] and g.GetShape()==prior.GetShape() and g.GetStart()==prior.GetStart() and g.GetEnd()==prior.GetEnd() and g.GetWidth()==prior.GetWidth()]
  if not matched:continue
  assert len(matched)==1 and g.GetShape()==pcbnew.SHAPE_T_SEGMENT
  uid=g.m_Uuid.AsString();prior=matched[0]
  graphic_ids.add(uid);selected.add(uid);g.SetLayer(prior.GetLayer());changes.append(dict(reference=name,kind='outline_segment',uuid=uid))
assert selected,'No checked ink changes to reuse'
pcbnew.SaveBoard(str(board_path.resolve()),board)
def comparable(text):
 def ref(m):
  block=m.group()
  if any(uid in block for uid in selected-graphic_ids):block=re.sub(r'\(layer "(?:F|B)\.(?:SilkS|Fab)"\)','(layer "SELECTED_REFERENCE_LAYER")',block)
  return block
 text=re.sub(r'^([ \t]+)\(property "Reference"[\s\S]*?^\1\)',ref,text,flags=re.M)
 def footprint(m):
  lines=[]
  def line(record):
   block=record.group()
   if any(uid in block for uid in graphic_ids):block=re.sub(r'\(layer "(?:F|B)\.(?:SilkS|Fab)"\)','(layer "SELECTED_GRAPHIC_LAYER")',block)
   lines.append(block);return ''
  body=re.sub(r'^([ \t]+)\(fp_line[\s\S]*?^\1\)',line,m.group(),flags=re.M)
  body=re.sub(r'^[ \t]*\n','',body,flags=re.M)
  return body+json.dumps(sorted(lines))
 return re.sub(r'^([ \t]+)\(footprint\b[\s\S]*?^\1\)',footprint,text,flags=re.M)
if comparable(original)!=comparable(board_path.read_text()):
 Path(str(board_path)+'.rejected-ink-candidate').write_text(board_path.read_text());board_path.write_text(original)
 raise AssertionError('Changed records beyond selected ink layers; original restored')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report=dict(referenceBoardSha256=sha(reference_path),originalBoardSha256=hashlib.sha256(original.encode()).hexdigest(),boardSha256=sha(board_path),changes=changes,copperPadsViasZonesOutlineAndPlacementsExactlyPreserved=True,requiresFreshLibraryAndAllRuleDrc=True,fabricationReady=False)
Path(str(board_path)+'.ink-layers.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(dict(referencesMoved=sum(c['kind']=='reference' for c in changes),outlineSegmentsMoved=len(graphic_ids),onlySelectedInkLayersChanged=True)))
