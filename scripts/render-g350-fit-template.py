"""Actual-size A4 fit template from the same outline used by tscircuit."""
import json
import hashlib
import sys
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader
import pypdfium2 as pdfium

geometry_path = Path('mechanical/g350-provisional-outline.json')
g = json.loads(geometry_path.read_text())
status = json.loads(Path('design-status.json').read_text())
entry = sys.argv[1] if len(sys.argv) > 1 else status['currentWork']['entry']
circuit_path = Path('dist') / entry.replace('.circuit.tsx', '') / 'circuit.json'
d = json.loads(circuit_path.read_text())
boards = [e for e in d if e['type'] == 'pcb_board']
assert len(boards) == 1
b = boards[0]
assert b['outline'] == g['outline']
assert (b['width'], b['height'], b['num_layers']) == (76, 118, 4)
assert not g['manufacturingOutlineApproved']

root = Path('output/pdf')
root.mkdir(parents=True, exist_ok=True)
out = root / 'g350-actual-size-fit-template.pdf'
c = canvas.Canvas(str(out), pagesize=A4, pageCompression=0, invariant=1)
c.setTitle('G350 provisional PCB - actual-size fit template')
c.setAuthor('G350 Linux handheld project')

def text(x, y, s, size=10, bold=False):
    c.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
    c.drawCentredString(x*mm, y*mm, s)

text(105, 277, 'G350 PCB fit template', 18, True)
text(105, 269, 'Print at 100% / Actual size. Disable Fit to page.', 11)
text(105, 261, 'Provisional dimensions - original shell fit is unverified.', 10)

# Exact board coordinates in millimetres; no drawing scale factor.
cx, cy = 105, 174
path = c.beginPath()
for i, p in enumerate(g['outline']):
    (path.moveTo if i == 0 else path.lineTo)((cx+p['x'])*mm, (cy+p['y'])*mm)
path.close()
c.setLineWidth(.15*mm)
c.drawPath(path, stroke=1, fill=0)
text(cx, cy+15, '76 x 118 mm overall', 12, True)
text(cx, cy+7, '1.6 mm thickness is provisional', 9)
text(cx, cy-3, 'Cut along the outside line.', 10)
text(cx, cy-10, 'Check internal ribs, posts and port access.', 9)
text(cx, cy-18, 'Mounting holes have not been measured.', 9)
text(cx, cy-53, '22 mm', 9)

# Dimension guide outside the cut-out; paper bar for printer calibration.
left, right, top, bottom = cx-38, cx+38, cy+59, cy-59
c.setLineWidth(.1*mm)
for x in [left, right]:
    c.line(x*mm, (top+2)*mm, x*mm, (top+10)*mm)
c.line(left*mm, (top+8)*mm, right*mm, (top+8)*mm)
text(cx, top+10, '76 mm', 10)
for y in [bottom, top]:
    c.line((right+2)*mm, y*mm, (right+11)*mm, y*mm)
c.line((right+9)*mm, bottom*mm, (right+9)*mm, top*mm)
c.saveState()
c.translate((right+14)*mm, cy*mm)
c.rotate(90)
c.setFont('Helvetica', 10)
c.drawCentredString(0, 0, '118 mm')
c.restoreState()

text(105, 95, '50 mm calibration bar - measure after printing', 11, True)
c.setLineWidth(.15*mm)
c.line(80*mm, 87*mm, 130*mm, 87*mm)
for x in [80, 130]:
    c.line(x*mm, 84*mm, x*mm, 90*mm)
text(105, 73, 'Main body: 76 x 99 mm. Lower speaker tab: 22 x 19 mm.', 10)
text(105, 66, 'The upper corners and lower shoulder edges are chamfered.', 9)
text(105, 54, 'Published outside enclosure: 81 x 128 x 22 mm.', 9)
text(105, 47, 'Outside dimensions do not define the internal cavity.', 9)
text(105, 34, 'Placement and mechanical study only; fabrication release remains incomplete.', 9)
text(105, 25, 'Source: handhelds.wiki/BATLEXP_G350_Overview', 8)
c.showPage()
c.save()

# Verify actual saved vector coordinates and page dimensions independently.
r = PdfReader(str(out))
assert len(r.pages) == 1
page = r.pages[0]
assert abs(float(page.mediabox.width)-A4[0]) < .001
assert abs(float(page.mediabox.height)-A4[1]) < .001
ops = page.get_contents().operations
vector = []
for args, op in ops:
    if op in (b'm', b'l'):
        vector.append({'x': float(args[0])/mm-cx, 'y': float(args[1])/mm-cy})
assert len(vector) >= len(g['outline'])
for actual, expected in zip(vector, g['outline']):
    assert abs(actual['x']-expected['x']) < .001
    assert abs(actual['y']-expected['y']) < .001
assert b'h' in [op for args, op in ops]
assert '76 x 118 mm overall' in page.extract_text()
assert 'unverified' in page.extract_text()

preview = Path('mechanical/g350-fit-template-preview.png')
pdfium.PdfDocument(str(out))[0].render(scale=2).to_pil().save(preview)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
report = {
    'status': 'PASS_ACTUAL_SIZE_PDF_GEOMETRY_ONLY',
    'fabricationReady': False, 'originalShellFitVerified': False,
    'pageSize': 'A4', 'printScale': '100% / Actual size',
    'savedVectorOutlineMatchesCircuit': True, 'vectorToleranceMm': .001,
    'dimensionsMm': {'width': 76, 'height': 118, 'speakerTabWidth': 22,
                     'speakerTabExtension': 19},
    'entry': entry, 'circuit': str(circuit_path),
    'hashes': {str(p): sha(p) for p in [geometry_path, circuit_path, out, preview,
                                     Path(__file__)]},
}
Path('mechanical/g350-fit-template-pdf-check.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({k: v for k, v in report.items() if k != 'hashes'}, indent=2))
