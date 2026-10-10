"""Combine disjoint real route edits; output still needs the strict overlay."""
import copy
import difflib
import hashlib
import json
from pathlib import Path
import shutil
import sys

base_path, left_path, right_path, root_text, names_text = sys.argv[1:]
paths = list(map(Path, (base_path, left_path, right_path)))
root = Path(root_text)
assert not root.exists()
arrays = [[x for x in json.loads(p.read_text()) if "error" not in x["type"]] for p in paths]
base, left, right = arrays
out = copy.deepcopy(base)
names = names_text.split(",")
assert len(names) == len(set(names)) and 0 < len(names) <= 49
for pair in (("DDR_CK", "DDR_CKn"), ("DDR_DQS0", "DDR_DQSn0"), ("DDR_DQS1", "DDR_DQSn1")):
    assert not any(n in names for n in pair) or all(n in names for n in pair), "Keep differential pairs together"

def strip(value):
    if isinstance(value, list):
        return [strip(x) for x in value]
    if isinstance(value, dict):
        return {k: strip(v) for k, v in value.items() if k not in ("copper_pour_id", "is_inside_copper_pour")}
    return value

def trace(array, sid):
    rows = [x for x in array if x["type"] == "pcb_trace" and x["source_trace_id"] == sid]
    assert len(rows) == 1
    return rows[0]

for kind in ("source_trace", "source_bus", "source_port", "source_net", "source_component", "pcb_board", "pcb_port", "pcb_smtpad", "pcb_component", "pcb_hole", "pcb_plated_hole", "pcb_via"):
    records = [[x for x in array if x["type"] == kind] for array in arrays]
    assert records[0] == records[1] == records[2], kind

selected_ids = set()
changes = []
for name in names:
    sources = [x for x in base if x["type"] == "source_trace" and x.get("name") == name]
    assert len(sources) == 1 and name.startswith("DDR_")
    sid = sources[0]["source_trace_id"]
    selected_ids.add(sid)
    original, a, b = [strip(trace(array, sid)) for array in arrays]
    metadata = lambda t: {k: v for k, v in t.items() if k not in ("route", "trace_length")}
    assert metadata(original) == metadata(a) == metadata(b)
    routes = [t["route"] for t in (original, a, b)]
    assert all([r[0], r[-1]] == [routes[0][0], routes[0][-1]] for r in routes)
    assert all([p for p in r if p["route_type"] == "via"] == [p for p in routes[0] if p["route_type"] == "via"] for r in routes)
    keys = [[json.dumps(p, sort_keys=True, separators=(",", ":")) for p in r] for r in routes]
    edits = []
    for side in (1, 2):
        for op, lo, hi, first, last in difflib.SequenceMatcher(None, keys[0], keys[side], autojunk=False).get_opcodes():
            if op == "equal":
                continue
            assert lo > 0 and hi < len(routes[0]), "Keep endpoint records exact"
            patch = routes[side][first:last]
            assert all(p["route_type"] == "wire" for p in routes[0][lo:hi] + patch), "Only planar windows may change"
            edits.append({"first": lo, "last": hi, "replacement": patch, "side": side})
    edits.sort(key=lambda x: (x["first"], x["last"]))
    unique = []
    for edit in edits:
        if unique and edit["first"] == unique[-1]["first"] and edit["last"] == unique[-1]["last"] and edit["replacement"] == unique[-1]["replacement"]:
            continue
        assert not unique or unique[-1]["last"] < edit["first"], "Conflicting or touching edits: " + name
        unique.append(edit)
    assert unique
    merged = copy.deepcopy(routes[0])
    for edit in reversed(unique):
        merged[edit["first"]:edit["last"]] = edit["replacement"]
    target = trace(out, sid)
    target["route"] = merged
    target.pop("trace_length", None)
    changes.append({"name": name, "edits": unique})

foreign = lambda array: [x for x in array if not (x["type"] == "pcb_trace" and x.get("source_trace_id") in selected_ids)]
assert foreign(out) == foreign(base)
root.mkdir()
shutil.copy2(__file__, root / "merge-windows.executed.py")
(root / "unqualified-donor.circuit.json").write_text(json.dumps(out, indent=2) + "\n")
(root / "report.json").write_text(json.dumps({
    "inputs": [{"path": str(p), "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths],
    "changes": changes,
    "allOriginalHolesEndpointsAndForeignRecordsExactlyPreserved": True,
    "requiresStrictOverlayFreshSourceAndIndependentQualification": True,
    "fabricationReady": False,
}, indent=2) + "\n")
print(json.dumps([{ "name": c["name"], "windowCount": len(c["edits"]) } for c in changes]))
