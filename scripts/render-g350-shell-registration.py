"""Source-bound 1:1 perimeter, control and assembly overlays for shell inspection.

This supplies a practical registration template, not measured original geometry.
Historical outline-only templates and their evidence are preserved.
"""
import hashlib
import json
import sys
from pathlib import Path

from pypdf import PdfReader
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas


def read(path):
    return json.loads(Path(path).read_text())


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


source = Path(sys.argv[1] if len(sys.argv) > 1 else 'dist/index/circuit.json')
geometry_path = Path('mechanical/g350-provisional-outline.json')
records, geometry = read(source), read(geometry_path)
board = next(r for r in records if r['type'] == 'pcb_board')
assert board['outline'] == geometry['outline']
assert (board['width'], board['height'], board['thickness'], board['num_layers']) == (76, 118, 1.6, 4)
assert not geometry['manufacturingOutlineApproved']
names = {r['source_component_id']: r['name'] for r in records if r['type'] == 'source_component'}
components = {r['pcb_component_id']: r for r in records if r['type'] == 'pcb_component'}
courtyards = [r for r in records if r['type'].startswith('pcb_courtyard_')]
assert len(components) == len(courtyards) == 280
features = [dict(name=names[r['source_component_id']], centerMm=r['center'],
                 layer=r['layer'], pcbComponentId=r['pcb_component_id'])
            for r in components.values()
            if names[r['source_component_id']].startswith(('KEY_', 'J_', 'SW_'))]
assert sum(f['name'].startswith('KEY_') for f in features) == 11

output = Path('output/pdf/g350-shell-registration-template.pdf')
output.parent.mkdir(parents=True, exist_ok=True)
c = canvas.Canvas(str(output), pagesize=A4, pageCompression=0, invariant=1)
c.setTitle('G350 current PCB - actual-size shell registration template')


def text(x, y, label, size=9, bold=False, centered=True):
    c.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
    (c.drawCentredString if centered else c.drawString)(x * mm, y * mm, label)


def polygon(points, cx, cy, stroke=.15):
    p = c.beginPath()
    for i, point in enumerate(points):
        (p.moveTo if i == 0 else p.lineTo)((cx + point['x']) * mm, (cy + point['y']) * mm)
    p.close()
    c.setLineWidth(stroke * mm)
    c.drawPath(p, stroke=1, fill=0)


def perimeter(cx, cy):
    c.setStrokeColorRGB(0, 0, 0)
    polygon(board['outline'], cx, cy, .2)


def courtyard(r, cx, cy):
    if 'outline' in r or 'points' in r:
        polygon(r.get('outline', r.get('points')), cx, cy, .1)
    elif r['type'] == 'pcb_courtyard_rect':
        c.setLineWidth(.1 * mm)
        c.rect((cx + r['center']['x'] - r['width'] / 2) * mm,
               (cy + r['center']['y'] - r['height'] / 2) * mm,
               r['width'] * mm, r['height'] * mm)
    elif r['type'] == 'pcb_courtyard_circle':
        c.circle((cx + r['center']['x']) * mm, (cy + r['center']['y']) * mm, r['radius'] * mm)
    else:
        raise ValueError('Unsupported courtyard shape: ' + r['type'])


def calibration(y):
    c.setStrokeColorRGB(0, 0, 0)
    c.setLineWidth(.15 * mm)
    c.line(80 * mm, y * mm, 130 * mm, y * mm)
    for x in (80, 130):
        c.line(x * mm, (y - 2) * mm, x * mm, (y + 2) * mm)
    text(105, y - 6, '50 mm - measure before cutting', 9)


def header(title):
    text(105, 279, title, 17, True)
    text(105, 271, 'Print at 100% / Actual size. Disable Fit to page.', 10)
    text(105, 264, 'Provisional 76 x 118 x 1.6 mm - original shell fit unverified.', 9)


# Page 1: actual footprint/contact centers, retained in the source X/Y datum.
header('G350 perimeter and registration')
cx, cy = 105, 183
perimeter(cx, cy)
selected_ids = {f['pcbComponentId'] for f in features}
c.setStrokeColorRGB(.5, .5, .5)
for r in courtyards:
    if r['pcb_component_id'] in selected_ids:
        courtyard(r, cx, cy)
for f in features:
    x, y = cx + f['centerMm']['x'], cy + f['centerMm']['y']
    c.setStrokeColorRGB(0, 0, 0)
    c.setLineWidth(.1 * mm)
    c.line((x - 1) * mm, y * mm, (x + 1) * mm, y * mm)
    c.line(x * mm, (y - 1) * mm, x * mm, (y + 1) * mm)
    label = f['name'].replace('KEY_', '').replace('J_', '').replace('SW_', '')
    # Labels on the left edge extend into the margin; other labels stay inboard.
    if f['name'].startswith('SW_'):
        text(x - 3, y + 2, label, 6)
    else:
        text(x, y + 2, label, 6)
text(cx, cy + 25, 'Current source positions', 10, True)
text(cx, cy + 18, 'Crosses: part/contact centers', 8)
text(cx, cy + 11, 'Gray: assembly courtyards', 8)
text(cx, cy + 4, 'Mark actual shell posts on this cutout.', 8)
text(105, 113, 'Cut on the solid perimeter. No mounting holes have been inferred.', 9)
text(105, 106, 'Both layers use the same PCB X/Y datum; this is a through-board overlay.', 8)
text(105, 99, 'Check the button membrane and USB-C / microSD openings against these positions.', 8)
calibration(87)
text(22, 67, 'Record after checking the original shell:', 10, True, False)
for y, label in [(57, 'Shell / original PCB revision: ____________________________________'),
                 (48, 'Perimeter / rib interference: _____________________________________'),
                 (39, 'Mount centers and diameters: ____________________________________'),
                 (30, 'Button / port alignment: _________________________________________')]:
    text(22, y, label, 9, False, False)
text(105, 15, 'Paper does not establish component-height clearance. Not a fabrication drawing.', 8)
c.showPage()

# Page 2: all 280 exact assembly courtyards; source coordinates on both sides.
header('G350 assembly-space overlays')
for layer, x in [('top', 59), ('bottom', 151)]:
    y = 190
    text(x, 253, layer.upper() + ' - source X/Y coordinates', 10, True)
    perimeter(x, y)
    c.setStrokeColorRGB(.4, .4, .4)
    for r in courtyards:
        if r['layer'] == layer:
            courtyard(r, x, y)
    text(x, 122, str(sum(r['layer'] == layer for r in courtyards)) + ' assembly courtyards', 9)
text(105, 112, 'Bottom overlay is unmirrored: viewed through the board in the same datum as Top.', 8)
text(105, 105, 'Flip the physical cutout to inspect the opposite shell half.', 8)
text(105, 97, 'Courtyards show planar assembly space, not component bodies or occupied heights.', 8)
calibration(84)
text(105, 63, 'Main body: 76 x 99 mm. Speaker tab: 22 mm wide, extending 19 mm.', 9)
text(105, 55, 'Original mounting, walls, ribs, button locations and port openings remain unmeasured.', 8)
text(105, 47, 'Check display, battery, speaker, flex and cable volumes with the assembled shell.', 8)
text(105, 27, 'Generated from the actual default tscircuit circuit.json; no part positions were changed.', 8)
text(105, 17, 'Source: dist/index/circuit.json | Geometry: mechanical/g350-provisional-outline.json', 7)
c.showPage()
c.save()

# Read saved PDF vector operations to confirm the first path is still 1:1.
pdf = PdfReader(output)
assert len(pdf.pages) == 2
for page, origin in zip(pdf.pages, [(105, 183), (59, 190)]):
    assert abs(float(page.mediabox.width) - A4[0]) < .001
    assert abs(float(page.mediabox.height) - A4[1]) < .001
    vector = [args for args, op in page.get_contents().operations if op in (b'm', b'l')]
    for args, expected in zip(vector, board['outline']):
        assert abs(float(args[0]) / mm - origin[0] - expected['x']) < .001
        assert abs(float(args[1]) / mm - origin[1] - expected['y']) < .001

registration = dict(status='PROVISIONAL_SOURCE_REGISTRATION_NOT_ORIGINAL_MEASUREMENTS',
                    entry='index.circuit.tsx', circuit=str(source), circuitSha256=sha(source),
                    boardDatum=dict(units='mm', origin='PCB center', positiveX='right in source', positiveY='up in source'),
                    dimensionsMm=dict(width=76, height=118, thickness=1.6), features=features,
                    mountingHoles=[], originalShellFitVerified=False, fabricationReady=False)
registration_path = Path('mechanical/g350-current-registration.json')
registration_path.write_text(json.dumps(registration, indent=2) + '\n')
report = dict(status='PASS_ACTUAL_SIZE_SOURCE_REGISTRATION_ONLY', pages=2,
              sourceFeatureCenters=len(features), frontContacts=11, assemblyCourtyards=280,
              outlineVectorToleranceMm=.001, printScale='100% / Actual size',
              originalShellFitVerified=False, fabricationReady=False,
              bottomOverlayMirrored=False,
              hashes={str(p): sha(p) for p in [source, geometry_path, output, registration_path, Path(__file__)]})
Path('checks/mechanical/g350-registration-template-check.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k != 'hashes'}, indent=2))
