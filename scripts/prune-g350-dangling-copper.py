"""Prune only KiCad-reported copper from a separate Circuit JSON candidate.

Input item geometry must come from the hash-bound board's DRC UUIDs. DDR copper,
placements and logical membership stay exact. Fresh replay, refill, all-pad
connectivity, native checks and Gerber checks are mandatory after every pass.
"""
import copy
import hashlib
import json
import math
import sys
from pathlib import Path

source, items_path, output = map(Path, sys.argv[1:4])
assert not output.exists()
circuit = json.loads(source.read_text())
items = json.loads(items_path.read_text())
layers = {'F.Cu': 'top', 'In1.Cu': 'inner1', 'In2.Cu': 'inner2', 'B.Cu': 'bottom'}
traces = {t['pcb_trace_id']: t for t in circuit if t['type'] == 'pcb_trace'}
ddr = {t['source_trace_id'] for t in circuit if t['type'] == 'source_trace' and t.get('name', '').startswith('DDR_')}
assert len(ddr) == 49

def close(a, b):
    return math.hypot(a['x'] - b['x'], a['y'] - b['y']) < 1e-5

cuts = {}
removed_vias = set()
matched = []
for item in items:
    found = []
    if item['type'] == 'via':
        for via in circuit:
            if via['type'] == 'pcb_via' and close(via, item['start']):
                found.append(via)
        assert len(found) == 1, (item, len(found))
        via = found[0]
        removed_vias.add(via['pcb_via_id'])
        for tid, trace in traces.items():
            for index, point in enumerate(trace['route']):
                if point['route_type'] == 'via' and close(point, via):
                    assert trace['source_trace_id'] not in ddr
                    cuts.setdefault(tid, {'edges': set(), 'points': set()})['points'].add(index)
        matched.append({'uuid': item['uuid'], 'via': via['pcb_via_id']})
    else:
        for tid, trace in traces.items():
            for index, (a, b) in enumerate(zip(trace['route'], trace['route'][1:])):
                if a['route_type'] == b['route_type'] == 'wire' and a['layer'] == b['layer'] == layers[item['layer']]:
                    if (close(a, item['start']) and close(b, item['end'])) or (close(b, item['start']) and close(a, item['end'])):
                        assert abs(a['width'] - item['width']) < 1e-5
                        found.append((tid, index))
        assert len(found) == 1, (item, found)
        tid, index = found[0]
        assert traces[tid]['source_trace_id'] not in ddr
        cuts.setdefault(tid, {'edges': set(), 'points': set()})['edges'].add(index)
        matched.append({'uuid': item['uuid'], 'trace': tid, 'edgeIndex': index})

replacements = {}
for tid, cut in cuts.items():
    trace = traces[tid]
    chunks, chunk = [], []
    for index, point in enumerate(trace['route']):
        if index in cut['points']:
            if chunk:
                chunks.append(chunk)
            chunk = []
            continue
        chunk.append(copy.deepcopy(point))
        if index in cut['edges']:
            chunks.append(chunk)
            chunk = []
    if chunk:
        chunks.append(chunk)
    kept = []
    for chunk in chunks:
        # Empty endpoint guards on a disconnected layer are not physical copper.
        positive = any(a['route_type'] == b['route_type'] == 'wire' and a['layer'] == b['layer'] and math.hypot(a['x']-b['x'], a['y']-b['y']) > 1e-7 for a, b in zip(chunk, chunk[1:]))
        # A retained via can still join other authored branches on several
        # layers. Keep its route carrier until a fresh DRC identifies it as
        # disposable; its owning trace must not silently disappear.
        if not positive and not any(p['route_type'] == 'via' for p in chunk):
            continue
        kept.append({**copy.deepcopy(trace), 'route': chunk})
    for index, trace in enumerate(kept):
        trace['pcb_trace_id'] = tid if len(kept) == 1 else f'{tid}_pruned_{index}'
    replacements[tid] = kept

result = []
for record in circuit:
    if record['type'] == 'pcb_trace' and record['pcb_trace_id'] in replacements:
        result.extend(replacements[record['pcb_trace_id']])
    elif record['type'] == 'pcb_via' and record['pcb_via_id'] in removed_vias:
        continue
    elif record['type'] == 'pcb_via' and record.get('pcb_trace_id') in replacements:
        owners = [t for t in replacements[record['pcb_trace_id']] if any(p['route_type'] == 'via' and close(p, record) for p in t['route'])]
        assert len(owners) == 1, record
        result.append({**record, 'pcb_trace_id': owners[0]['pcb_trace_id']})
    else:
        result.append(record)
for kind in ('source_trace', 'source_port', 'source_net', 'source_bus', 'pcb_component', 'pcb_board', 'pcb_smtpad', 'pcb_plated_hole'):
    assert [r for r in result if r['type'] == kind] == [r for r in circuit if r['type'] == kind]
for kind in ('pcb_trace', 'pcb_via'):
    def is_ddr(r):
        return r.get('source_trace_id') in ddr if kind == 'pcb_trace' else traces.get(r.get('pcb_trace_id'), {}).get('source_trace_id') in ddr
    assert [r for r in result if r['type'] == kind and is_ddr(r)] == [r for r in circuit if r['type'] == kind and is_ddr(r)]
output.write_text(json.dumps(result, indent=2) + '\n')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
report = dict(sourceSha256=sha(source), itemsSha256=sha(items_path), resultSha256=sha(output), removedVias=len(removed_vias), removedReportedTrackSegments=sum(len(v['edges']) for v in cuts.values()), editedTraceRecords=len(cuts), entirelyRemovedTraceRecords=sum(not v for v in replacements.values()), matches=matched, ddrCopperExactlyPreserved=True, logicalMembershipAndPlacementExactlyPreserved=True, requiresFreshReplayAndIndependentChecks=True, fabricationReady=False)
Path(str(output)+'.pruning.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({k: v for k, v in report.items() if k != 'matches'}))
