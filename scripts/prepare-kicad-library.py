"""Export the board's exact footprints through KiCad's native serializer."""
from pathlib import Path
import hashlib
import re
import shutil
import sys

import pcbnew

# macOS needs wx application traits for KiCad's path/serializer services.
if sys.platform == "darwin":
    import wx
    wx.Log.SetLogLevel(wx.LOG_Error)
    application = wx.App(False)

board_path = Path(sys.argv[1]).resolve()
library_path = board_path.parent / "tscircuit.pretty"
record_pattern = re.compile(
    r"^\t\((?:footprint|segment|via|zone|gr_\w+|general|layers|setup)\b[\s\S]*?^\t\)",
    re.M,
)


def physical_records(text):
    # Compare every saved footprint, track, via, zone, drawing and stack/setup
    # record. Only the library identity may change; serialization may reorder.
    records = sorted(
        re.sub(r'\(footprint "[^"]+"', '(footprint "LOCAL_LIBRARY_ID"', match.group())
        for match in record_pattern.finditer(text)
    )
    if len(records) < 100:
        raise RuntimeError("Expected a KiCad-normalized board with physical records")
    return records


original = board_path.read_text()
before = physical_records(original)
board = pcbnew.LoadBoard(str(board_path))
footprints = list(board.GetFootprints())
if not footprints:
    raise RuntimeError("No board footprints found")
if library_path.exists():
    shutil.rmtree(library_path)
library_path.mkdir()
plugin = pcbnew.PCB_IO_MGR.FindPlugin(pcbnew.PCB_IO_MGR.KICAD_SEXP)
names = set()
for footprint in footprints:
    uuid = footprint.m_Uuid.AsString().replace("-", "")
    reference = re.sub("[^A-Za-z0-9_]", "_", footprint.GetReference() or "mechanical")
    name = f"g350_{reference}_{uuid}"
    if name in names:
        raise RuntimeError("Duplicate footprint library identity")
    names.add(name)
    footprint.SetFPID(pcbnew.LIB_ID("tscircuit", name))
    plugin.FootprintSave(str(library_path), pcbnew.FOOTPRINT(footprint))
pcbnew.SaveBoard(str(board_path), board)
after = physical_records(board_path.read_text())
if before != after:
    board_path.write_text(original)
    raise RuntimeError("Footprint library preparation changed physical board records")
(board_path.parent / "fp-lib-table").write_text(
    '(fp_lib_table\n  (version 7)\n'
    '  (lib (name "tscircuit") (type "KiCad") '
    '(uri "${KIPRJMOD}/tscircuit.pretty") (options "") '
    '(descr "Exact project footprints exported from tscircuit"))\n)\n'
)
digest = hashlib.sha256("\n".join(before).encode()).hexdigest()
print(f"Exported {len(footprints)} exact local footprints; all {len(before)} physical records unchanged.")
print(f"Physical-record SHA256: {digest}")
