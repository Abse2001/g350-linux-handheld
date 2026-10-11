"""Plot actual checked planning copper; never imply a fabrication qualification."""
import hashlib
import json
import sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle

circuit_path, report_path, output = map(Path, sys.argv[1:4])
assert not output.exists()
circuit = json.loads(circuit_path.read_text())
report = json.loads(report_path.read_text())
assert report['physicalPassed'] and all(v == 0 for v in report['counts'].values())
names = set(report['selectedNames'])
ids = {e['source_trace_id'] for e in circuit if e['type'] == 'source_trace' and e.get('name') in names}
traces = [e for e in circuit if e['type'] == 'pcb_trace' and e.get('source_trace_id') in ids]
assert len(traces) == len(names)
assert all(t['route'][0].get('start_pcb_port_id') and t['route'][-1].get('end_pcb_port_id') for t in traces)
fig, ax = plt.subplots(figsize=(8, 11), dpi=150)
fig.patch.set_facecolor('#fafafa'); ax.set_facecolor('#fafafa')
for t in [e for e in circuit if e['type'] == 'pcb_trace']:
    checked = t.get('source_trace_id') in ids
    for a, b in zip(t['route'], t['route'][1:]):
        if a['route_type'] == b['route_type'] == 'wire' and a['layer'] == b['layer']:
            color = {'top': '#d33735', 'bottom': '#245bce'}.get(a['layer'], '#bbb') if checked else '#d9d9d9'
            ax.plot([a['x'], b['x']], [a['y'], b['y']], color=color, lw=1.25 if checked else .35, zorder=4 if checked else 1)
for e in circuit:
    if e['type'] == 'pcb_via':
        ax.add_patch(Circle((e['x'], e['y']), e['outer_diameter']/2, fill=False, edgecolor='#777', lw=.35, zorder=2))
    if e['type'] == 'pcb_smtpad' and e.get('shape') == 'circle':
        ax.add_patch(Circle((e['x'], e['y']), e['radius'], facecolor='#dfb758', edgecolor='none', zorder=3))
ax.set(xlim=(-10, 10), ylim=(-2, 29), xlabel='mm', ylabel='mm'); ax.set_aspect('equal'); ax.grid(alpha=.13)
ram_sources = {e['source_component_id'] for e in circuit if e['type'] == 'source_component' and e.get('name') == 'U_RAM'}
ram_parts = [e for e in circuit if e['type'] == 'pcb_component' and e.get('source_component_id') in ram_sources]
assert len(ram_parts) == 1
ram = ram_parts[0]
ax.text(-9, 26.8, 'AM3352', fontsize=10, color='#444')
ax.text(-9, ram['center']['y'], f"RAM ({ram['center']['x']:g}, {ram['center']['y']:g}), {ram['rotation']:g}°", fontsize=9, color='#444')
ax.set_title(f'G350 DDR routing progress: {len(names)} / 49 local channels\nTop = red · Bottom = blue · Gray = fixed copper / reserved fanouts', fontsize=11, pad=14)
fig.text(.5, .025, f'EXPERIMENTAL — {49-len(names)} channels missing; source, timing and full CAD DRC unfinished.', ha='center', fontsize=8, color='#8b2f24')
fig.tight_layout(rect=(0, .045, 1, 1)); fig.savefig(output); plt.close(fig)
output.with_suffix('.provenance.json').write_text(json.dumps({'source':str(circuit_path),'sourceSha256':hashlib.sha256(circuit_path.read_bytes()).hexdigest(),'nativeReport':str(report_path),'checkedLocalChannels':len(names),'required':49,'wholeBoardUnqualified':True,'fabricationReady':False},indent=2)+'\n')
