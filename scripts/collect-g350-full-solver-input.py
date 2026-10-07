"""Collect every fresh explicit and implicit routing connection from a build."""
import hashlib
import json
import sys
from pathlib import Path

run, out = map(Path, sys.argv[1:3])
assert not out.exists()
inputs = sorted(run.glob('phase-*.input.simple-route.json'))
assert len(inputs) == 3, 'Expected all three routing phases'
rows = [json.loads(p.read_text()) for p in inputs]
for row in rows:
    assert row['layerCount'] == 4 and row['allowBlindAndBuriedVias'] is False
    assert row['minViaPadDiameter'] == .4572 and row['minViaHoleDiameter'] == .254
connections = [c for row in rows for c in row['connections']]
assert len(connections) == 217
assert len({c['name'] for c in connections}) == len(connections), 'Duplicate routing connections'
ports = {}
for connection in connections:
    for point in connection['pointsToConnect']:
        pid = point['pcb_port_id']
        value = (point['x'], point['y'], point['layer'])
        assert pid not in ports or ports[pid] == value, 'Inconsistent physical port'
        ports[pid] = value
result = {**rows[0], 'connections': connections, 'traces': []}
out.write_text(json.dumps(result, indent=2) + '\n')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
Path(str(out) + '.collection.json').write_text(json.dumps({
    'inputs': [{'path': str(p), 'sha256': sha(p)} for p in inputs],
    'resultSha256': sha(out), 'connections': len(connections), 'physicalPorts': len(ports),
    'fabricationReady': False,
}, indent=2) + '\n')
print(f'Collected {len(connections)} connections and {len(ports)} required physical ports')
