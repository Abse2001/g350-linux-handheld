"""Plot actual DDR copper from a compiled circuit, with a common four-layer view."""
import json
import sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Rectangle

circuit_path, output_path = map(Path, sys.argv[1:3])
circuit = json.loads(circuit_path.read_text())
names = {r['source_trace_id']: r.get('name', '') for r in circuit if r['type'] == 'source_trace'}
traces = [r for r in circuit if r['type'] == 'pcb_trace' and names.get(r['source_trace_id'], '').startswith('DDR_')]
assert len(traces) == 49, 'This view requires all 49 DDR traces'
points = [p for t in traces for p in t['route'] if 'x' in p]
xs, ys = [p['x'] for p in points], [p['y'] for p in points]
colors = {'top': '#ef4444', 'inner1': '#fbbf24', 'inner2': '#38bdf8', 'bottom': '#a78bfa'}
fig, axes = plt.subplots(2, 2, figsize=(12, 10), facecolor='#111827')
for ax, (layer, color) in zip(axes.flat, colors.items()):
    ax.set_facecolor('#111827')
    for r in circuit:
        if r['type'] == 'pcb_smtpad' and 'x' in r:
            w = r.get('width', r.get('radius', .2) * 2)
            h = r.get('height', w)
            ax.add_patch(Rectangle((r['x'] - w / 2, r['y'] - h / 2), w, h, facecolor='#64748b', alpha=.32))
    for t in traces:
        for a, b in zip(t['route'], t['route'][1:]):
            if a['route_type'] == b['route_type'] == 'wire' and a.get('layer') == b.get('layer') == layer:
                ax.plot([a['x'], b['x']], [a['y'], b['y']], color=color, linewidth=.7)
    for v in circuit:
        if v['type'] == 'pcb_via':
            ax.add_patch(Circle((v['x'], v['y']), v['outer_diameter'] / 2, fill=False, edgecolor='#e2e8f0', linewidth=.35))
    ax.set_xlim(min(xs) - 2, max(xs) + 2)
    ax.set_ylim(min(ys) - 2, max(ys) + 2)
    ax.set_aspect('equal')
    ax.set_title(layer, color=color, fontsize=15)
    ax.tick_params(colors='#94a3b8', labelsize=8)
    for spine in ax.spines.values():
        spine.set_color('#334155')
fig.suptitle('G350 — rotated RAM — 49/49 DDR connections', color='white', fontsize=18)
fig.text(.5, .025, 'Actual source copper • four layers • electrical timing qualification unfinished', ha='center', color='#cbd5e1', fontsize=11)
fig.tight_layout(rect=[0, .05, 1, .95])
fig.savefig(output_path, dpi=180, facecolor=fig.get_facecolor())
