import {writeFileSync} from "node:fs"

// Manufacturing limits for this 1oz, four-layer board. Routing targets 0.2mm
// clearance; exact supplier pads can have slightly smaller gaps. These limits
// remain above JLCPCB's published multilayer copper capabilities.
writeFileSync("dist/index/kicad/index.kicad_dru",`(version 1)
(rule "G350 minimum copper spacing"
  (constraint clearance (min 0.15mm)))
(rule "G350 minimum trace width"
  (constraint track_width (min 0.15mm)))
(rule "G350 through-via diameter"
  (constraint via_diameter (min 0.65mm)))
(rule "G350 annular ring"
  (constraint annular_width (min 0.15mm)))
(rule "G350 drilled hole minimum"
  (constraint hole_size (min 0.3mm)))
(rule "G350 hole separation"
  (constraint hole_to_hole (min 0.2mm)))
(rule "G350 copper to drill"
  (constraint hole_clearance (min 0.2mm)))
(rule "G350 routed edge clearance"
  (constraint edge_clearance (min 0.5mm)))
(rule "G350 legend clearance"
  (constraint silk_clearance (min 0.15mm)))
`)
console.log("Prepared explicit KiCad manufacturing rules.")
