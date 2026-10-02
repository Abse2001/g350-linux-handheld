import {readFileSync,writeFileSync} from "node:fs"
import {createHash} from "node:crypto"

// This checks the exported memory fixture, never a pad-only aborted render.
// It is a connectivity check, not DDR timing or complete-host qualification.
const input=process.argv[2]??"dist/experiments/rk3566-memory-vip/circuit.json"
const output=process.argv[3]??"checks/integrated/memory-connectivity.json"
const raw=readFileSync(input)
const elements=JSON.parse(raw)
const selected=JSON.parse(readFileSync("lib/integrated/memory-connections.json"))
const byType=t=>elements.filter(e=>e.type===t)
const board=byType("pcb_board")[0]
const sources=byType("source_trace")
const traces=byType("pcb_trace")
const vias=byType("pcb_via")
const ports=byType("pcb_port")
const thin=process.argv[4]==="--thin-hdi"
const hdi=thin||process.argv[4]==="--hdi"
const signalLayers=hdi?["top","inner1","inner3","inner5","inner6"]:["top","inner2","inner3","bottom"]
const allLayers=hdi?["top","inner1","inner2","inner3","inner4","inner5","inner6","bottom"]:["top","inner1","inner2","inner3","inner4","bottom"]
const sameLayers=(a,b)=>a?.length===b.length&&b.every(l=>a.includes(l))
const problems=[]
if(board?.num_layers!==allLayers.length) problems.push(`Expected ${allLayers.length} physical copper layers`)
if(traces.length===0||vias.length<134) problems.push("Missing routed copper or declared manual escapes")
if(byType("pcb_smtpad").length!==765)problems.push("Expected every one of the 765 processor/RAM pads")
if(byType("pcb_component").some(c=>c.layer!=="top")) problems.push("Bottom-side component present")
for(const v of vias) {
  if(hdi) {
    const micro=sameLayers(v.layers,["top","inner1"])&&v.hole_diameter===.1&&v.outer_diameter===.25
    const buried=sameLayers(v.layers,allLayers.slice(1,-1))&&v.hole_diameter===(thin?.1:.15)&&v.outer_diameter===(thin?.25:.3)
    if(!micro&&!buried||v.through_hole!==false)problems.push(`Invalid HDI drill geometry/span: ${v.pcb_via_id}`)
  } else if(!sameLayers(v.layers,allLayers))problems.push(`Non-through via: ${v.pcb_via_id}`)
}
if(hdi&&vias.filter(v=>sameLayers(v.layers,["top","inner1"])).length!==134)problems.push("Expected 134 Top-L2 microvias")
for(const t of traces) for(const p of t.route)
  if(p.route_type==="wire"&&!signalLayers.includes(p.layer))
    problems.push(`Signal on reserved reference layer: ${t.pcb_trace_id}/${p.layer}`)

const results=[]
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)
for(const connection of selected) {
  const source=sources.find(s=>s.name===connection.name)
  if(!source) {problems.push(`Missing source net ${connection.name}`);continue}
  const sameNet=e=>e.source_trace_id===source.source_trace_id||
    (source.subcircuit_connectivity_map_key&&
     e.subcircuit_connectivity_map_key===source.subcircuit_connectivity_map_key)
  const copper=traces.filter(sameNet)
  const netVias=vias.filter(v=>sameNet(v)||copper.some(t=>t.pcb_trace_id===v.pcb_trace_id))
  const endpoints=ports.filter(p=>source.connected_source_port_ids.includes(p.source_port_id))
  const nodes=[],edges=[]
  const add=(p,layer)=>{const id=nodes.length;nodes.push({x:p.x,y:p.y,layer,width:p.width??0});edges.push(new Set());return id}
  const join=(a,b)=>{edges[a].add(b);edges[b].add(a)}
  for(const t of copper) {
    let last
    for(const p of t.route) {
      if(p.route_type==="wire") {
        const id=add(p,p.layer)
        if(last!==undefined) {
          if(nodes[last].layer!==p.layer) problems.push(`Unrepresented layer transition: ${connection.name}`)
          else join(last,id)
        }
        last=id
      } else if(p.route_type==="via") {
        const a=add(p,p.from_layer),b=add(p,p.to_layer)
        const represented=netVias.some(v=>distance(v,p)<1e-5&&v.layers.includes(p.from_layer)&&v.layers.includes(p.to_layer))
        if(!represented) problems.push(`Missing physical via: ${connection.name}`)
        else join(a,b)
        if(last!==undefined&&nodes[last].layer===p.from_layer&&distance(nodes[last],p)<1e-5) join(last,a)
        else problems.push(`Disconnected via entry: ${connection.name}`)
        last=b
      } else if(p.route_type==="through_pad") {
        const a=add({...p.start,width:p.width},p.start_layer),b=add({...p.end,width:p.width},p.end_layer)
        const represented=netVias.some(v=>distance(v,p.start)<=v.outer_diameter/2+p.width/2+1e-5&&
          distance(v,p.end)<=v.outer_diameter/2+p.width/2+1e-5&&v.layers.includes(p.start_layer)&&v.layers.includes(p.end_layer))
        if(!represented) problems.push(`Unverified through-pad traversal: ${connection.name}`)
        else join(a,b)
        if(last!==undefined&&nodes[last].layer===p.start_layer&&distance(nodes[last],p.start)<1e-5) join(last,a)
        else problems.push(`Disconnected through-pad entry: ${connection.name}`)
        last=b
      } else problems.push(`Unknown route element ${p.route_type}: ${connection.name}`)
    }
  }
  // Connect coincident copper vertices and all endpoints landing on one
  // physical same-net via. This also joins manual and autorouted trace pieces.
  for(let i=0;i<nodes.length;i++) for(let j=0;j<i;j++) {
    if(nodes[i].layer===nodes[j].layer&&distance(nodes[i],nodes[j])<1e-5) join(i,j)
    else if(netVias.some(v=>v.layers.includes(nodes[i].layer)&&v.layers.includes(nodes[j].layer)&&
      distance(nodes[i],v)<=v.outer_diameter/2+nodes[i].width/2+1e-5&&
      distance(nodes[j],v)<=v.outer_diameter/2+nodes[j].width/2+1e-5)) join(i,j)
  }
  const terminalNodes=endpoints.map(p=>nodes.flatMap((n,i)=>
    p.layers.includes(n.layer)&&distance(p,n)<1e-5?[i]:[]))
  const visited=new Set(),queue=[...(terminalNodes[0]??[])]
  while(queue.length) {const n=queue.pop();if(visited.has(n))continue;visited.add(n);queue.push(...edges[n])}
  const connected=endpoints.length===2&&terminalNodes.every(ids=>ids.some(id=>visited.has(id)))
  if(!connected) problems.push(`Unconnected memory signal: ${connection.name}`)
  results.push({name:connection.name,connected,tracePieces:copper.length,physicalVias:netVias.length})
}
const nativeErrors=elements.filter(e=>e.type.endsWith("_error"))
const report={status:problems.length?"MEMORY_CONNECTIVITY_FAIL":"MEMORY_CONNECTIVITY_PASS_HOST_INCOMPLETE",
  scope:`Memory copper connectivity, signal-layer restriction, physical ${hdi?"HDI drill spans":"through-vias"} and top-only placement. No DDR timing, shorts, impedance or full-host qualification.`,
  input,sha256:createHash("sha256").update(raw).digest("hex"),
  pads:byType("pcb_smtpad").length,traces:traces.length,vias:vias.length,
  connectedSignals:results.filter(r=>r.connected).length,requiredSignals:67,
  nativeErrorCounts:Object.fromEntries([...new Set(nativeErrors.map(e=>e.type))].map(t=>[t,nativeErrors.filter(e=>e.type===t).length])),
  problems:[...new Set(problems)],signals:results}
writeFileSync(output,JSON.stringify(report,null,2)+"\n")
console.log(`${report.status}: ${report.connectedSignals}/67 signals; ${report.traces} traces, ${report.vias} vias; ${report.problems.length} problems. See ${output}`)
if(problems.length) process.exitCode=1
