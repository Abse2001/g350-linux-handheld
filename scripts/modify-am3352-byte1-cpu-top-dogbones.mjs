import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [bootstrap,directory]=process.argv.slice(2);assert(bootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),input=read(`${bootstrap}/input.simple-route.json`)
const source=read(prior.source.path);assert.equal(hash(prior.source.path),prior.source.sha256)
const native=read(`${bootstrap}/signal-escapes.native.json`),edited=structuredClone(native)
assert.equal(native.length,22)
const moves=[{signal:'DDR_D13',old:{x:1.6,y:-5.6},next:{x:1.6,y:-4.8}},
  {signal:'DDR_D14',old:{x:1.6,y:-4.8},next:{x:1.6,y:-4}}]
const changed=new Set()
for(const m of moves){
 const id=source.find(e=>e.type==='source_trace'&&e.name===m.signal).source_trace_id
 const t=edited.find(e=>e.source_trace_id===id&&e.route[0].y>-15);assert(t)
 assert.equal(t.route.length,2);assert(t.route.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016))
 assert(Math.hypot(t.route[1].x-m.old.x,t.route[1].y-m.old.y)<1e-6)
 t.route[1].x=m.next.x;t.route[1].y=m.next.y;changed.add(t.pcb_trace_id)
 assert(Math.abs(Math.hypot(t.route[1].x-t.route[0].x,t.route[1].y-t.route[0].y)-Math.sqrt(.32))<1e-6)
}
for(let i=0;i<native.length;i++)if(!changed.has(native[i].pcb_trace_id))assert.deepEqual(native[i],edited[i])
mkdirSync(directory,{recursive:true})
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
writeFileSync(`${directory}/signal-escapes.native.json`,JSON.stringify(edited,null,2)+'\n')
const correction={moves,package:'U_SOC',original:{path:`${bootstrap}/signal-escapes.native.json`,sha256:hash(`${bootstrap}/signal-escapes.native.json`)},
  actualSourceCopperUnchanged:true,otherNativeDogbonesUnchanged:20,physicalChecksRequired:true}
writeFileSync(`${directory}/result.json`,JSON.stringify({...prior,manualCpuDogboneCorrection:correction,
  input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)}},null,2)+'\n')
console.log(JSON.stringify(correction))
