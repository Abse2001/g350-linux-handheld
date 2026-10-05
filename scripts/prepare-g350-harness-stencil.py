"""Match KiCad SMT stencil metadata to the native tscircuit paste records.

The converter currently adds full-size paste to every exposed SMT pad. This
adapter removes absent apertures and applies the native aperture scale. It
does not change copper, mask, drills, pin numbers, nets or component placement.
Unassociated native through-hole paste records are reported as an open gate.
"""
import hashlib
import json
import math
from pathlib import Path
import sys
import pcbnew

if sys.platform == 'darwin':
    import wx
    wx.Log.SetLogLevel(wx.LOG_Error)
    application = wx.App(False)

board_path, circuit_path, report_path = map(Path, sys.argv[1:4])
verify_only = '--verify-only' in sys.argv[4:]
d = json.loads(circuit_path.read_text())
source = {e['source_component_id']: e for e in d if e['type'] == 'source_component'}
components = {e['pcb_component_id']: e for e in d if e['type'] == 'pcb_component'}
ports = {e['pcb_port_id']: e for e in d if e['type'] == 'pcb_port'}
source_ports = {e['source_port_id']: e for e in d if e['type'] == 'source_port'}
pads = [e for e in d if e['type'] in ('pcb_smtpad', 'pcb_plated_hole')]
holes = [e for e in d if e['type'] == 'pcb_hole']
paste = [e for e in d if e['type'] == 'pcb_solder_paste']
assert len(source) == 277 and len(pads) == 1156
assert len(holes) == 2 and all(h['hole_shape']=='circle' for h in holes)

def native_box(p):
    if p['shape'] == 'polygon':
        xx = [v['x'] for v in p['points']]
        yy = [v['y'] for v in p['points']]
    else:
        w = p.get('width', p.get('outer_width', 2*p.get('radius', p.get('outer_diameter', 0)/2)))
        h = p.get('height', p.get('outer_height', w))
        a = math.radians(p.get('ccw_rotation', 0))
        bb = [(p['x']+x*math.cos(a)-y*math.sin(a), p['y']+x*math.sin(a)+y*math.cos(a))
              for x,y in [(-w/2,-h/2),(w/2,-h/2),(w/2,h/2),(-w/2,h/2)]]
        xx, yy = [v[0] for v in bb], [v[1] for v in bb]
    return (100+(max(xx)+min(xx))/2, 100-(max(yy)+min(yy))/2, max(xx)-min(xx), max(yy)-min(yy))

def pin_number(p):
    port = ports.get(p.get('pcb_port_id'), {})
    sp = source_ports.get(port.get('source_port_id'), {})
    return str(sp.get('pin_number', sp.get('name', '')))

def reference(p):
    return source[components[p['pcb_component_id']]['source_component_id']]['name']

def mm(value):
    return pcbnew.ToMM(value)

def physical(p):
    # Paste metadata and UUIDs do not participate in this physical invariant.
    mask_copper = [layer for layer in (pcbnew.F_Cu, pcbnew.In1_Cu, pcbnew.In2_Cu,
                  pcbnew.B_Cu, pcbnew.F_Mask, pcbnew.B_Mask) if p.GetLayerSet().Contains(layer)]
    copper = []
    for layer in mask_copper:
        if layer not in (pcbnew.F_Cu,pcbnew.In1_Cu,pcbnew.In2_Cu,pcbnew.B_Cu):
            continue
        poly = p.GetEffectivePolygon(layer)
        copper.append((layer,tuple(tuple((poly.Outline(i).CPoint(j).x,poly.Outline(i).CPoint(j).y)
            for j in range(poly.Outline(i).PointCount())) for i in range(poly.OutlineCount()))))
    return (p.GetParentFootprint().GetReference(),p.GetNumber(),int(p.GetShape()),
            p.GetPosition().x,p.GetPosition().y,p.GetSize().x,p.GetSize().y,
            p.GetDrillSize().x,p.GetDrillSize().y,p.GetOrientation().AsDegrees(),
            # KiCad reindexes numeric net codes on save. Compare the net
            # identity, not that serialization index.
            p.GetNetname(),tuple(mask_copper),p.GetLocalSolderMaskMargin(),
            p.GetRoundRectRadiusRatio(),tuple(copper))

board = pcbnew.LoadBoard(str(board_path.resolve()))
kpads = list(board.GetPads())
assert len(kpads) == len(pads)+len(holes)
before = sorted(physical(p) for p in kpads)
matched, matched_holes, removed, scaled, full = set(), set(), 0, 0, 0
for p in kpads:
    ref, pin = p.GetParentFootprint().GetReference(), p.GetNumber()
    box = p.GetBoundingBox()
    actual = (mm(box.GetCenter().x),mm(box.GetCenter().y),mm(box.GetWidth()),mm(box.GetHeight()))
    if p.GetAttribute() == pcbnew.PAD_ATTRIB_NPTH:
        candidates = [h for h in holes if reference(h)==ref and pin=='' and
            all(abs(a-b)<.001 for a,b in zip(actual,
                (100+h['x'],100-h['y'],h['hole_diameter'],h['hole_diameter'])))]
        assert len(candidates)==1
        h=candidates[0]
        assert h['pcb_hole_id'] not in matched_holes
        assert abs(mm(p.GetDrillSize().x)-h['hole_diameter'])<.001
        assert abs(mm(p.GetDrillSize().y)-h['hole_diameter'])<.001
        matched_holes.add(h['pcb_hole_id'])
        continue
    candidates = [q for q in pads if reference(q)==ref and pin_number(q)==pin and
                  all(abs(a-b)<.001 for a,b in zip(actual,native_box(q)))]
    if len(candidates) != 1:
        raise RuntimeError(f'Physical pad does not uniquely match native source: {ref}.{pin} {actual}: {len(candidates)}')
    q = candidates[0]
    identity = q.get('pcb_smtpad_id', q.get('pcb_plated_hole_id'))
    assert identity not in matched
    matched.add(identity)
    if q['type'] != 'pcb_smtpad':
        assert q['shape']=='pill' and p.GetShape()==pcbnew.PAD_SHAPE_OVAL
        assert abs(mm(p.GetDrillSize().x)-q['hole_width'])<.001
        assert abs(mm(p.GetDrillSize().y)-q['hole_height'])<.001
        continue
    copper_layer = pcbnew.F_Cu if q['layer']=='top' else pcbnew.B_Cu
    if q['shape']=='circle':
        assert p.GetShape()==pcbnew.PAD_SHAPE_CIRCLE
    elif q['shape']=='rect':
        radius=q.get('corner_radius',0)
        assert p.GetShape()==(pcbnew.PAD_SHAPE_ROUNDRECT if radius else pcbnew.PAD_SHAPE_RECT)
        if radius:
            assert abs(mm(p.GetRoundRectCornerRadius(copper_layer))-radius)<.001
    elif q['shape']=='polygon':
        assert p.GetShape()==pcbnew.PAD_SHAPE_CUSTOM
        poly=p.GetEffectivePolygon(copper_layer)
        assert poly.OutlineCount()==1 and poly.HoleCount(0)==0
        outline=poly.Outline(0)
        actual_points=[(mm(outline.CPoint(j).x),mm(outline.CPoint(j).y)) for j in range(outline.PointCount())]
        # Native imported paths repeat segment endpoints and the closing
        # vertex. Remove only zero-length repetitions; retain small steps.
        expected_points=[]
        for v in q['points']:
            point=(100+v['x'],100-v['y'])
            if not expected_points or math.dist(point,expected_points[-1])>1e-9:
                expected_points.append(point)
        if math.dist(expected_points[0],expected_points[-1])<1e-9:
            expected_points.pop()
        assert len(actual_points)==len(expected_points), f'Polygon vertex count {ref}.{pin}'
        assert all(min(math.hypot(a[0]-v[0],a[1]-v[1]) for v in expected_points)<.001 for a in actual_points)
        assert all(min(math.hypot(a[0]-v[0],a[1]-v[1]) for a in actual_points)<.001 for v in expected_points)
    else:
        raise RuntimeError('Unsupported native SMT pad shape '+q['shape'])
    ap = [a for a in paste if a.get('pcb_smtpad_id') == identity]
    assert len(ap) <= 1
    layers = p.GetLayerSet()
    if not ap:
        if verify_only:
            assert not layers.Contains(pcbnew.F_Paste) and not layers.Contains(pcbnew.B_Paste)
        else:
            layers.RemoveLayer(pcbnew.F_Paste)
            layers.RemoveLayer(pcbnew.B_Paste)
            p.SetLayerSet(layers)
        removed += 1
        continue
    a = ap[0]
    assert a['layer'] == q['layer'] and a['shape'] == q['shape']
    active_layer = pcbnew.F_Paste if q['layer']=='top' else pcbnew.B_Paste
    other_layer = pcbnew.B_Paste if q['layer']=='top' else pcbnew.F_Paste
    assert layers.Contains(active_layer) and not layers.Contains(other_layer)
    if q['shape']=='circle':
        ratio = a['radius']/q['radius']
    else:
        ratio = a['width']/q['width']
        assert abs(ratio-a['height']/q['height']) < 1e-6
    assert 0 < ratio <= 1
    if not verify_only:
        p.SetLocalSolderPasteMargin(0)
        p.SetLocalSolderPasteMarginRatio((ratio-1)/2)
    delta = p.GetSolderPasteMargin(active_layer)
    size = p.GetSize()
    # KiCad independently calculates the two-axis aperture dimensions.
    assert abs((size.x+2*delta.x)/size.x-ratio) < .0001
    assert abs((size.y+2*delta.y)/size.y-ratio) < .0001
    if ratio == 1: full += 1
    else: scaled += 1
assert len(matched) == len(pads)
assert len(matched_holes) == len(holes)
assert before == sorted(physical(p) for p in kpads)
if not verify_only:
    temporary = board_path.with_name(board_path.stem+'.stencil-check.kicad_pcb')
    pcbnew.SaveBoard(str(temporary.resolve()),board)
    reloaded = pcbnew.LoadBoard(str(temporary.resolve()))
    after = sorted(physical(p) for p in reloaded.GetPads())
    if before != after:
        differences = [dict(reference=a[0],pin=a[1],fields=[i for i in range(len(a)) if a[i]!=b[i]],
            before=a,after=b) for a,b in zip(before,after) if a!=b]
        report_path.with_suffix('.geometry-diagnostic.json').write_text(json.dumps(differences,indent=2)+'\n')
        raise AssertionError('Saved geometry differs; see geometry-diagnostic.json')
    temporary.replace(board_path)
unassociated = [a for a in paste if not a.get('pcb_smtpad_id')]
report = dict(status='PASS_SMT_STENCIL_METADATA_ONLY',fabricationReady=False,
    readOnlyVerification=verify_only,
    boardSha256=hashlib.sha256(board_path.read_bytes()).hexdigest(),
    helperSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    circuit=str(circuit_path),circuitSha256=hashlib.sha256(circuit_path.read_bytes()).hexdigest(),
    matchedPhysicalPads=len(matched),matchedNonplatedHoles=len(matched_holes),
    nativePadShapeCornerRadiusAndPolygonVerticesVerified=True,
    noPasteSmtPads=removed,scaledSmtApertures=scaled,
    fullSizeSmtApertures=full,copperMaskDrillPlacementAndNetsUnchanged=True,
    unassociatedNativeApertures=len(unassociated),nativeThroughHoleStencilCleanupPending=bool(unassociated),
    fullStencilQualification=False)
report_path.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
