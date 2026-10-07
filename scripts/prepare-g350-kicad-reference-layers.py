"""Move DRC-conflicting reference fields and outline segments to Fab layers.

Reference names, positions, visibility and every copper record remain unchanged.
No DRC rule is disabled. Recheck the new board and regenerate its local library.
"""
import hashlib,json,re,sys
from pathlib import Path
import pcbnew

board_path,report_path=map(Path,sys.argv[1:3])
report=json.loads(report_path.read_text())
original=board_path.read_text()
board=pcbnew.LoadBoard(str(board_path.resolve()))
refs={fp.Reference().m_Uuid.AsString():fp for fp in board.GetFootprints()}
graphics={item.m_Uuid.AsString():(fp,item) for fp in board.GetFootprints() for item in fp.GraphicalItems()}
selected=set()
for error in report.get('violations',[]):
    if error['type'] not in ('silk_overlap','silk_over_copper','silk_edge_clearance'):continue
    for item in error['items']:
        if item['description'].startswith('Reference field of '):
            assert item['uuid'] in refs
            selected.add(item['uuid'])
        elif item['description'].startswith('Segment of '):
            assert item['uuid'] in graphics
            selected.add(item['uuid'])
assert selected,'No conflicting reference fields or outline segments found'
changes=[]
for uid in sorted(selected):
    fp,field=(refs[uid],refs[uid].Reference()) if uid in refs else graphics[uid]
    layer=field.GetLayer()
    assert layer in (pcbnew.F_SilkS,pcbnew.B_SilkS)
    field.SetLayer(pcbnew.F_Fab if layer==pcbnew.F_SilkS else pcbnew.B_Fab)
    changes.append(dict(reference=fp.GetReference(),uuid=uid,kind='reference' if uid in refs else 'outline_segment'))
pcbnew.SaveBoard(str(board_path.resolve()),board)
def comparable(text):
    text=re.sub(r'^([ \t]+)\(property "Reference"[\s\S]*?^\1\)',
        lambda m:re.sub(r'\(layer "(?:F|B)\.(?:SilkS|Fab)"\)','(layer "REFERENCE_LAYER")',m.group()),text,flags=re.M)
    # KiCad orders outline segments by layer. Compare their full records within
    # each owning footprint, retaining UUID, coordinates, stroke and ownership.
    def footprint(m):
        lines=[]
        def line(record):
            block=record.group()
            if any(uid in block for uid in selected if uid in graphics):
                block=re.sub(r'\(layer "(?:F|B)\.(?:SilkS|Fab)"\)','(layer "SELECTED_GRAPHIC_LAYER")',block)
            lines.append(block)
            return ''
        body=re.sub(r'^([ \t]+)\(fp_line[\s\S]*?^\1\)',line,m.group(),flags=re.M)
        body=re.sub(r'^[ \t]*\n','',body,flags=re.M)
        return body+json.dumps(sorted(lines))
    return re.sub(r'^([ \t]+)\(footprint\b[\s\S]*?^\1\)',footprint,text,flags=re.M)
if comparable(original)!=comparable(board_path.read_text()):
    Path(str(board_path)+'.rejected-ink-candidate').write_text(board_path.read_text())
    board_path.write_text(original)
    raise AssertionError('Serialization changed records beyond selected ink layers; original restored')
result=dict(originalBoardSha256=hashlib.sha256(original.encode()).hexdigest(),
    boardSha256=hashlib.sha256(board_path.read_bytes()).hexdigest(),
    drcReportSha256=hashlib.sha256(report_path.read_bytes()).hexdigest(),
    movedReferences=changes,onlySelectedInkLayersChanged=True,
    requiresFreshLibraryAndAllRuleDrc=True,fabricationReady=False)
Path(str(board_path)+'.reference-layers.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(dict(movedItems=len(changes),onlySelectedInkLayersChanged=True)))
