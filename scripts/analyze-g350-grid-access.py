"""Distinguish exhausted search budgets from closed saved grid access.

Four-neighbour planar reachability equals eight-neighbour reachability with
forbidden corner cuts. Layer changes use the saved via mask. This diagnoses
the search graph only; continuous copper and independent checks remain required.
"""
import json, sys, time
from pathlib import Path
sys.path.insert(0, str(Path('.cloud-tools/python-routing').resolve()))
import numpy as np
from scipy.ndimage import label

root, out = map(Path, sys.argv[1:3])
assert not out.exists()
rows = []
for path in sorted(root.glob('failed-access-*.npz')):
    begun = time.monotonic()
    saved = np.load(path)
    blocked, via, goal, starts = [saved[k] for k in ('blocked', 'via', 'goal', 'starts')]
    assert blocked.shape == goal.shape and blocked.shape[0] == 4
    assert via.shape == blocked.shape[1:]
    labels, counts, parents = [], [], {}
    def find(item):
        parents.setdefault(item, item)
        if parents[item] != item:
            parents[item] = find(parents[item])
        return parents[item]
    for layer in range(4):
        regions, count = label(~blocked[layer])
        labels.append(regions)
        counts.append(count)
    for layer in range(4):
        for other in range(layer):
            sites = via & ~blocked[layer] & ~blocked[other]
            base = counts[other] + 1
            codes = np.unique(labels[layer][sites].astype(np.int64) * base + labels[other][sites])
            for code in codes:
                parents[find((layer, int(code // base)))] = find((other, int(code % base)))
    start_groups = set()
    for x, y, layer in starts:
        assert not blocked[layer, y, x]
        start_groups.add(find((int(layer), int(labels[layer][y, x]))))
    goal_groups = {find((layer, int(region))) for layer in range(4) for region in np.unique(labels[layer][goal[layer]]) if region}
    row = dict(file=str(path), starts=len(starts), layerComponents=counts,
               startGroups=len(start_groups), goalGroups=len(goal_groups),
               connectedFreeAccess=bool(start_groups & goal_groups),
               seconds=time.monotonic()-begun)
    rows.append(row)
    print(json.dumps(row), flush=True)
assert rows, 'No saved failed-access graphs to diagnose'
out.write_text(json.dumps(dict(graphOnly=True, requiresIndependentVerification=True,
                              results=rows, fabricationReady=False), indent=2)+'\n')
