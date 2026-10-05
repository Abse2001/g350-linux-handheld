import {readFileSync,writeFileSync} from "node:fs"
import {createHash} from "node:crypto"

// Independent continuity and planar timing check on actual Circuit JSON.
// Missing copper, wrong pad selection, illegal transitions and partial buses
// fail. This never grants full-board electrical/manufacturing approval.
const input=process.argv[2]??"dist/experiments/am3352-ddr-bootstrap/circuit.json"
const output=process.argv[3]??"checks/integrated/am3352-memory-connectivity.json"
const raw=readFileSync(input),elements=JSON.parse(raw)
const mapPath=process.argv[4]??"lib/am3352/memory-connections.json"
const mapRaw=readFileSync(mapPath),expected=JSON.parse(mapRaw)
const byType=t=>elements.filter(e=>e.type===t)
const board=byType("pcb_board")[0],sources=byType("source_trace"),traces=byType("pcb_trace"),vias=byType("pcb_via")
const ports=byType("pcb_port"),sourcePorts=byType("source_port"),components=byType("source_component")
const layers=["top","inner1","inner2","bottom"]
const signalLayers=["top","bottom"]
const problems=[]
const packageSourceIds=components.filter(c=>["U_SOC","U_RAM"].includes(c.name)).map(c=>c.source_component_id)
const packagePcbIds=byType("pcb_component").filter(c=>packageSourceIds.includes(c.source_component_id)).map(c=>c.pcb_component_id)
const packagePads=byType("pcb_smtpad").filter(p=>packagePcbIds.includes(p.pcb_component_id))
let referenceBounds
if(expected.length!==49||new Set(expected.map(c=>c.name)).size!==49||
  new Set(expected.map(c=>c.socPin)).size!==49||new Set(expected.map(c=>c.ramPin)).size!==49)
  throw new Error("Expected the complete 49-signal connection map")
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)
if(board?.num_layers!==4)problems.push("Active reroute must use exactly four physical copper layers")
if(board?.min_via_pad_diameter!==.4572||board?.min_via_hole_diameter!==.254)
  problems.push("Current four-layer candidate requires TI 18mil lands and 10mil drills")
for(const [layer,name] of [["inner1","GND"],["inner2","DDR_1V5"]]){
  const net=byType("source_net").find(n=>n.name===name)
  const pours=byType("pcb_copper_pour").filter(p=>p.layer===layer&&p.source_net_id===net?.source_net_id)
  if(pours.length!==1)problems.push(`Missing or fragmented dedicated reference region: ${layer}/${name}`)
  for(const p of pours){
    const vertices=p.brep_shape?.outer_ring?.vertices
    if(!vertices?.length)problems.push(`Unsupported reference geometry: ${layer}`)
    else {
      const bounds={minX:Math.min(...vertices.map(v=>v.x)),maxX:Math.max(...vertices.map(v=>v.x)),minY:Math.min(...vertices.map(v=>v.y)),maxY:Math.max(...vertices.map(v=>v.y))}
      if(layer==="inner2")referenceBounds=bounds
      if(packagePads.some(p=>p.x<bounds.minX||p.x>bounds.maxX||p.y<bounds.minY||p.y>bounds.maxY))
        problems.push(`Reference region does not cover the placed CPU/RAM packages: ${layer}`)
    }
  }
}
if(byType("pcb_smtpad").filter(p=>packagePcbIds.includes(p.pcb_component_id)).length!==420)
  problems.push("Expected all 420 processor/RAM pads")
if(!traces.length||!vias.length)problems.push("No completed routed copper")
for(const v of vias) {
  if(v.layers?.length!==4||!layers.every(l=>v.layers.includes(l)))problems.push(`Not a full-depth four-layer through-via: ${v.pcb_via_id}`)
  if(v.outer_diameter<.4572-1e-6||v.hole_diameter<.254-1e-6||(v.outer_diameter-v.hole_diameter)/2<.1016-1e-6)
    problems.push(`Invalid trial via geometry: ${v.pcb_via_id}`)
}
const results=[]
for(const connection of expected) {
  const source=sources.find(s=>s.name===connection.name)
  if(!source) {problems.push(`Missing source signal: ${connection.name}`);continue}
  const terminals=source.connected_source_port_ids.map(id=>sourcePorts.find(p=>p.source_port_id===id))
  const expectedPorts=[["U_SOC",connection.socPin,connection.socBall],["U_RAM",connection.ramPin,connection.ramBall]]
  const correctTerminals=terminals.length===2&&expectedPorts.every(([name,pin,ball])=>terminals.some(p=>
    p?.pin_number===Number(pin.slice(3))&&p.name===ball&&components.find(c=>c.source_component_id===p.source_component_id)?.name===name))
  if(!correctTerminals)problems.push(`Wrong actual package terminal: ${connection.name}`)
  const sameNet=e=>e.source_trace_id===source.source_trace_id||e.connection_name===source.source_trace_id||e.connectsTo?.includes(source.source_trace_id)||e.subcircuit_connectivity_map_key&&e.subcircuit_connectivity_map_key===source.subcircuit_connectivity_map_key
  const copper=traces.filter(sameNet)
  const netVias=vias.filter(v=>sameNet(v)||copper.some(t=>t.pcb_trace_id===v.pcb_trace_id))
  const endpoints=ports.filter(p=>source.connected_source_port_ids.includes(p.source_port_id))
  const nodes=[],edges=[]
  const add=(p,layer)=>{const i=nodes.length;nodes.push({...p,layer});edges.push(new Map());return i}
  const join=(a,b,w)=>{edges[a].set(b,Math.min(edges[a].get(b)??Infinity,w));edges[b].set(a,Math.min(edges[b].get(a)??Infinity,w))}
  for(const t of copper) {
    let last
    for(const p of t.route) {
      if(p.route_type==="wire") {
        if(!referenceBounds||p.x<referenceBounds.minX-1e-6||p.x>referenceBounds.maxX+1e-6||p.y<referenceBounds.minY-1e-6||p.y>referenceBounds.maxY+1e-6)
          problems.push(`DDR wire outside its reserved reference region: ${connection.name}`)
        if(!signalLayers.includes(p.layer))problems.push(`Signal copper on reserved reference layer: ${connection.name}/${p.layer}`)
        const i=add(p,p.layer)
        if(last!==undefined) {
          if(nodes[last].layer!==p.layer)problems.push(`Unrepresented layer transition: ${connection.name}`)
          else join(last,i,distance(nodes[last],p))
        }
        last=i
      } else if(p.route_type==="via") {
        const a=add(p,p.from_layer),b=add(p,p.to_layer)
        const declared=netVias.some(v=>distance(v,p)<1e-5&&v.layers.includes(p.from_layer)&&v.layers.includes(p.to_layer))
        if(!declared)problems.push(`Missing physical via: ${connection.name}`)
        else join(a,b,0)
        if(last!==undefined&&nodes[last].layer===p.from_layer&&distance(nodes[last],p)<1e-5)join(last,a,0)
        else problems.push(`Disconnected via entry: ${connection.name}`)
        last=b
      } else problems.push(`Unsupported route primitive: ${connection.name}/${p.route_type}`)
    }
  }
  for(let i=0;i<nodes.length;i++)for(let j=0;j<i;j++)if(distance(nodes[i],nodes[j])<1e-5&&
    (nodes[i].layer===nodes[j].layer||netVias.some(v=>distance(v,nodes[i])<1e-5&&v.layers.includes(nodes[i].layer)&&v.layers.includes(nodes[j].layer))))join(i,j,0)
  const terminalNodes=endpoints.map(p=>nodes.flatMap((n,i)=>p.layers.includes(n.layer)&&distance(p,n)<1e-5?[i]:[]))
  const lengths=nodes.map(()=>Infinity),visited=new Set()
  for(const i of terminalNodes[0]??[])lengths[i]=0
  while(visited.size<nodes.length) {
    let next=-1,best=Infinity
    for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&lengths[i]<best){next=i;best=lengths[i]}
    if(next<0)break
    visited.add(next)
    for(const [i,w] of edges[next])lengths[i]=Math.min(lengths[i],best+w)
  }
  const measured=endpoints.length===2?Math.min(...(terminalNodes[1]??[]).map(i=>lengths[i])):Infinity
  const connected=correctTerminals&&Number.isFinite(measured)
  if(!connected)problems.push(`Unconnected memory signal: ${connection.name}`)
  results.push({name:connection.name,connected,planarLengthMm:connected?measured:null,tracePieces:copper.length,physicalVias:netVias.length})
}
const groups=[
  {name:"DDR_BYTE0",members:expected.filter(c=>/^DDR_D[0-7]$|^DDR_DQM0$|^DDR_DQS[n]?0$/.test(c.name)).map(c=>c.name),limit:.635},
  {name:"DDR_BYTE1",members:expected.filter(c=>/^DDR_D(8|9|1[0-5])$|^DDR_DQM1$|^DDR_DQS[n]?1$/.test(c.name)).map(c=>c.name),limit:.635},
  {name:"DDR_COMMAND_CLOCK",members:expected.filter(c=>/^DDR_(A\d+|BA\d+|CASn|RASn|WEn|CSn0|CKE|ODT|CKn?)$/.test(c.name)).map(c=>c.name),limit:.635},
  ...[["DQS0","DQSn0"],["DQS1","DQSn1"],["CK","CKn"]].map(([p,n])=>({name:`DDR_${p}_PAIR`,members:[`DDR_${p}`,`DDR_${n}`],limit:.127})),
]
if(groups[0].members.length!==11||groups[1].members.length!==11||groups[2].members.length!==26)
  throw new Error("Timing checks must cover both complete byte groups and all 26 address/control/clock signals")
const timing=groups.map(g=>{
  const members=g.members.map(n=>results.find(r=>r.name===n))
  const complete=members.every(r=>r?.connected)
  const skewMm=complete?Math.max(...members.map(r=>r.planarLengthMm))-Math.min(...members.map(r=>r.planarLengthMm)):null
  const pass=complete&&skewMm<=g.limit+1e-5
  if(!pass)problems.push(`Incomplete or unmatched planar timing group: ${g.name}`)
  return {name:g.name,signals:g.members.length,skewMm,limitMm:g.limit,pass}
})
const nativeErrors=elements.filter(e=>e.type.endsWith("_error"))
if(nativeErrors.length)problems.push(`Unresolved native circuit errors: ${nativeErrors.length}`)
const report={status:problems.length?"AM3352_MEMORY_FAIL":"AM3352_MEMORY_PLANAR_CONNECTIVITY_PASS_HOST_INCOMPLETE",
  circuitSha256:createHash("sha256").update(raw).digest("hex"),requiredSignals:49,connectedSignals:results.filter(r=>r.connected).length,
  connectionMap:{path:mapPath,sha256:createHash("sha256").update(mapRaw).digest("hex")},
  copperLayerCount:board?.num_layers,maxCopperLayers:4,
  permittedSignalLayers:signalLayers,referenceBounds,
  tracePieces:traces.length,physicalVias:vias.length,results,timing,problems,nativeErrors,
  fullElectricalTimingQualified:false,fabricationReady:false,
  scope:"Signal continuity and planar shortest copper lengths only. Does not include via depth, package delay, impedance or powered-host qualification."}
writeFileSync(output,JSON.stringify(report,null,2)+"\n")
console.log(JSON.stringify({status:report.status,connectedSignals:report.connectedSignals,tracePieces:traces.length,physicalVias:vias.length,problems:problems.length}))
if(problems.length)process.exitCode=1
