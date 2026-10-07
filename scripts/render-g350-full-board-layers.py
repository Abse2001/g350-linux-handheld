"""Render actual copper from a full-board circuit; the caption states status."""
import json
import sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Rectangle, Polygon
from matplotlib.collections import LineCollection

source_path, image_path = map(Path, sys.argv[1:3])
caption = sys.argv[3]
source = json.loads(source_path.read_text())
board = next(s for s in source if s['type'] == 'pcb_board')
outline = board['outline']
colors = {'top': '#f87171', 'inner1': '#fbbf24', 'inner2': '#38bdf8', 'bottom': '#a78bfa'}
fig, axes = plt.subplots(1, 4, figsize=(16, 7), facecolor='#111827')
for ax, (layer, color) in zip(axes, colors.items()):
    ax.set_facecolor('#111827')
    xs = [p['x'] for p in outline] + [outline[0]['x']]
    ys = [p['y'] for p in outline] + [outline[0]['y']]
    ax.plot(xs, ys, color='#e2e8f0', linewidth=.8)
    for p in source:
        if p['type'] == 'pcb_smtpad' and layer in p.get('layers', [p.get('layer')]):
            if p['shape'] == 'circle':
                ax.add_patch(Circle((p['x'], p['y']), p['radius'], color='#94a3b8', alpha=.4))
            elif p['shape'] in ('rect', 'rotated_rect'):
                w, h = p['width'], p['height']
                ax.add_patch(Rectangle((p['x'] - w / 2, p['y'] - h / 2), w, h, angle=p.get('ccw_rotation', 0), rotation_point='center', color='#94a3b8', alpha=.4))
            elif p['shape'] == 'polygon':
                ax.add_patch(Polygon([(v['x'], v['y']) for v in p['points']], color='#94a3b8', alpha=.4))
    segments = []
    for t in source:
        if t['type'] != 'pcb_trace':
            continue
        for a, b in zip(t['route'], t['route'][1:]):
            if a['route_type'] == b['route_type'] == 'wire' and a['layer'] == b['layer'] == layer:
                segments.append([(a['x'], a['y']), (b['x'], b['y'])])
    ax.add_collection(LineCollection(segments, colors=color, linewidths=.45))
    for v in source:
        if v['type'] == 'pcb_via':
            ax.add_patch(Circle((v['x'], v['y']), v['outer_diameter'] / 2, fill=False, edgecolor='#e2e8f0', linewidth=.25))
        elif v['type'] == 'pcb_hole':
            ax.add_patch(Circle((v['x'], v['y']), v['hole_diameter'] / 2, color='#e2e8f0'))
    ax.set_xlim(-40, 40)
    ax.set_ylim(-61, 61)
    ax.set_aspect('equal')
    ax.set_title(layer, color=color, fontsize=14)
    ax.tick_params(colors='#94a3b8', labelsize=7)
    for spine in ax.spines.values():
        spine.set_color('#334155')
fig.suptitle('G350 — actual four-layer copper — 280 placed parts', color='white', fontsize=18)
fig.text(.5, .02, caption, color='#cbd5e1', ha='center', fontsize=11)
fig.tight_layout(rect=[0, .04, 1, .93])
fig.savefig(image_path, dpi=180, facecolor=fig.get_facecolor())
