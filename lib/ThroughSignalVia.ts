import { Via, Port } from "tscircuit"

// Core 0.0.2042 initializes Via ports before parent attachment, when it
// assumes two layers. A four-layer through-via therefore lacks inner ports.
// Add the two access ports only to our named signal vias. Physical span stays
// bottom-to-top and is checked in the final circuit and KiCad export.
const prototype=Via.prototype as Via & {g350InnerPortsEnabled?:boolean}
if(!prototype.g350InnerPortsEnabled) {
  const original=prototype.initPorts
  prototype.initPorts=function() {
    original.call(this)
    if(!this.props.name?.startsWith("LCD_SIGNAL_")) return
    for(const layer of ["inner1","inner2"] as const) {
      const port=new Port({name:layer,layer})
      port.registerMatch(this)
      this.add(port)
    }
  }
  prototype.g350InnerPortsEnabled=true
}
