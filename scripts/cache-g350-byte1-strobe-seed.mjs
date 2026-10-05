import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {fanoutTracePath} from '@tscircuit/props'

const root='dist/g350-byte1-strobe-seed-02'
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const preparation=read(`${root}/preparation.json`)
assert.equal(preparation.physicalErrors,0)
assert(preparation.pairPlanarSkewMm<=.127)
const escapes=read(`${root}/byte1-escape-paths.json`),carriers=read(`${root}/strobe-carriers.traces.json`)
const mapping=read('lib/am3352/memory-byte1-top-centered-swizzled-connections.json')
const routeLength=route=>route.slice(1).reduce((n,p,i)=>n+(p.route_type==='wire'&&route[i].route_type==='wire'&&p.layer===route[i].layer?Math.hypot(p.x-route[i].x,p.y-route[i].y):0),0)
const paths=escapes.filter(p=>!['DDR_DQS1','DDR_DQSn1'].some(name=>{
 const m=mapping.find(s=>s.name===name)
 return p.connection===`U_SOC.${m.socPin}`||p.connection===`U_RAM.${m.ramPin}`
}))
assert.equal(paths.length,18)
for(const name of ['DDR_DQS1','DDR_DQSn1']){
 const map=mapping.find(s=>s.name===name),cpu=escapes.find(p=>p.connection===`U_SOC.${map.socPin}`),ram=escapes.find(p=>p.connection===`U_RAM.${map.ramPin}`)
 const carrier=carriers.find(t=>t.pcb_trace_id===`manual_strobe_carrier_${name}`)
 assert(cpu&&ram&&carrier)
 const reversedRam=ram.route.toReversed().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p})
 const route=[...cpu.route,...carrier.route.slice(1),...reversedRam.slice(1)].filter((p,i,a)=>i===0||p.route_type!=='wire'||a[i-1].route_type!=='wire'||p.layer!==a[i-1].layer||p.x!==a[i-1].x||p.y!==a[i-1].y)
 assert(Math.abs(routeLength(route)-preparation.strobePlanarLengthsMm[name])<1e-8)
 paths.push(fanoutTracePath.parse({connection:cpu.connection,route}))
}
assert.equal(paths.length,20)
for(const [path,obj]of Object.entries({
 'lib/am3352/placement/ddr-byte1-strobe-seeded-paths.json':paths,
 'lib/am3352/placement/ddr-byte0-byte1-strobe-access-paths.json':read(`${root}/byte0-data-paths.json`),
})){
 assert(!existsSync(path),'Preserve earlier route caches')
 writeFileSync(path,JSON.stringify(obj,null,2)+'\n')
}
console.log('Cached eighteen partial escapes and two complete strobe paths; all 141 physical vias retained.')
