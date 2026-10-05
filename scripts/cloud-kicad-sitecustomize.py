"""Compatibility for Debian KiCad 10.0.6's Python 3.14 SWIG iterator.

pcbnew's generated VECTOR wrappers call iterator.next(), while the generated
SwigPyIterator exposes only __next__. Keep iteration/StopIteration semantics
unchanged; do not alter board data, validators, or assertions.
"""
import pcbnew

if not hasattr(pcbnew.SwigPyIterator, "next"):
    pcbnew.SwigPyIterator.next = pcbnew.SwigPyIterator.__next__
