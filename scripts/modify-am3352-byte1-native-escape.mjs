import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Keep the native bus_lanes bootstrap. Move only the C2/D9 signal dogbone
// into the C1 reference hole's former position after the authored C1 move.
// This is a manual routing candidate; independent DRC remains mandatory.
const [bootstrap,directory,mode='c2-only']=process.argv.slice(2)
assert(['c2-only','central-access'].includes(mode))
assert(bootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const report=read(`${bootstrap}/result.json`),input=read(`${bootstrap}/input.simple-route.json`)
const source=read(report.source.path),map=read(report.memoryMap.path)
assert.equal(hash(report.source.path),report.source.sha256)
assert.equal(report.preparedLocalEscapes,22)
assert.equal(report.preservedSavedDdr.signals,11)
assert(report.ramReferenceLayout)
const c1=source.find(e=>e.type==='pcb_via'&&Math.hypot(e.x+3.8,e.y+22.2)<1e-6);assert(c1)
assert(!source.some(e=>e.type==='pcb_via'&&Math.hypot(e.x+2.8,e.y+23)<1e-6))
const native=read(`${bootstrap}/signal-escapes.native.json`),modified=structuredClone(native)
const moves=[{signal:'DDR_D9',ball:'C2',pad:{x:-2.4,y:-22.6},old:{x:-2,y:-23},next:{x:-2.8,y:-23}}]
if(mode==='central-access')moves.push(
  {signal:'DDR_DQS1',ball:'C7',pad:{x:1.6,y:-22.6},old:{x:2,y:-23},next:{x:1.2,y:-23}},
  {signal:'DDR_DQSn1',ball:'B7',pad:{x:1.6,y:-21.8},old:{x:2,y:-22.2},next:{x:1.2,y:-22.2}},
  {signal:'DDR_D14',ball:'B8',pad:{x:2.4,y:-21.8},old:{x:2.8,y:-22.2},next:{x:2,y:-22.2}},
  {signal:'DDR_D15',ball:'C8',pad:{x:2.4,y:-22.6},old:{x:2.8,y:-23},next:{x:2,y:-23}})
const changed=new Set()
for(const m of moves){
  const mapping=map.find(c=>c.name===m.signal);assert.equal(mapping.ramBall,m.ball)
  const id=source.find(e=>e.type==='source_trace'&&e.name===m.signal).source_trace_id
  const escape=modified.find(t=>t.source_trace_id===id&&t.route[0].y<-15);assert(escape)
  assert(Math.hypot(escape.route[0].x-m.pad.x,escape.route[0].y-m.pad.y)<1e-6)
  for(const p of escape.route.slice(1)){assert(Math.hypot(p.x-m.old.x,p.y-m.old.y)<1e-6);p.x=m.next.x;p.y=m.next.y}
  assert.equal(escape.route.filter(p=>p.route_type==='via').length,1);changed.add(escape.pcb_trace_id)
}
const holes=[...source.filter(e=>e.type==='pcb_via'),...modified.flatMap(t=>t.route.filter(p=>p.route_type==='via'))]
let minimumDrillGap=Infinity
for(let i=0;i<holes.length;i++)for(let j=0;j<i;j++)minimumDrillGap=Math.min(minimumDrillGap,Math.hypot(holes[i].x-holes[j].x,holes[i].y-holes[j].y)-.254)
assert(minimumDrillGap>=.254-1e-6)
for(let i=0;i<native.length;i++)if(!changed.has(native[i].pcb_trace_id))assert.deepEqual(native[i],modified[i])
mkdirSync(directory,{recursive:true})
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
writeFileSync(`${directory}/signal-escapes.native.json`,JSON.stringify(modified,null,2)+'\n')
const correction={mode,package:'U_RAM',moves,nativeOriginal:{path:`${bootstrap}/signal-escapes.native.json`,sha256:hash(`${bootstrap}/signal-escapes.native.json`)},
  minimumDrillEdgeGapMm:minimumDrillGap,otherNativeEscapesUnchanged:22-moves.length,
  sourceCopperUnchanged:true,physicalChecksRequired:true}
writeFileSync(`${directory}/result.json`,JSON.stringify({...report,input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},manualNativeEscapeCorrection:correction},null,2)+'\n')
console.log(JSON.stringify(correction))
