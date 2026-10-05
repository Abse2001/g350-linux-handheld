import {Via,Port} from "tscircuit"

// Core 0.0.2056 initializes Via's ports before parent attachment, assuming
// two layers. The physical span is still four layers after attachment.
// This diagnostic-only adapter exposes inner2 on exactly two named reference
// vias. It changes no route solver, copper position, drill or physical span.
const prototype=Via.prototype as Via & {g350ReferenceInnerPortEnabled?:boolean}
if(!prototype.g350ReferenceInnerPortEnabled){
  const original=prototype.initPorts
  prototype.initPorts=function(){
    original.call(this)
    if(!["V_RAM_D2_REFERENCE","V_RAM_B2_REFERENCE"].includes(this.props.name??""))return
    const port=new Port({name:"inner2",layer:"inner2"})
    port.registerMatch(this)
    this.add(port)
  }
  prototype.g350ReferenceInnerPortEnabled=true
}
