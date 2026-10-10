// Recover unqualified outer tuning only when a fresh locked native ground
// reconstruction retains every ground pad. Full source/KiCad/Gerber gates follow.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {gzipSync,gunzipSync} from 'node:zlib'
import * as checks from '@tscircuit/checks'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
const [input,donor,root]=process.argv.slice(2);assert(input&&donor&&root&&!fs.existsSync(root));fs.mkdirSync(root)
const read=p=>JSON.parse(fs.readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex')
for(const p of ['scripts/recover-g350-ground-safe-outer-tuning.mjs','scripts/refill-g350-native-ground-diagnostic.mjs','scripts/lib/g350-ddr-planar-planning-validator.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
let c=read(input).filter(e=>!e.type.includes('error'));const d=read(donor),validator=createG350PlanarPlanningValidator(c)
const names=new Map(c.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>[e.source_trace_id,e.name]))
const split=r=>{const spans=[],vias=[];let s=[];for(const p of r){if(p.route_type==='via'){spans.push(s);s=[];vias.push(p)}else s.push(p)}spans.push(s);return {spans,vias}}
const joinedOuter=(trace,other)=>{const a=split(trace.route),b=split(other.route);assert.deepEqual(a.vias,b.vias);const r=[];for(let i=0;i<a.spans.length;i++){assert.equal(a.spans[i][0].layer,b.spans[i][0].layer);r.push(...structuredClone(['top','bottom'].includes(a.spans[i][0].layer)?b.spans[i]:a.spans[i]));if(i<a.vias.length)r.push(structuredClone(a.vias[i]))}return r}
const pairNames=[['DDR_DQS0','DDR_DQSn0'],['DDR_DQS1','DDR_DQSn1'],['DDR_CK','DDR_CKn']]
const units=c.filter(e=>e.type==='pcb_trace'&&names.has(e.source_trace_id)&&!pairNames.some(p=>p.includes(names.get(e.source_trace_id)))).map(e=>[e.source_trace_id])
for(const pair of pairNames)units.push([...names].filter(([id,n])=>pair.includes(n)).map(([id])=>id))
const gain=ids=>ids.reduce((n,id)=>{const a=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===id),b=d.find(e=>e.type==='pcb_trace'&&e.source_trace_id===id);return n+ddrRouteLength(joinedOuter(a,b))-ddrRouteLength(a.route)},0)
units.sort((a,b)=>gain(b)-gain(a));const attempts=[]
const groups=()=>c.filter(e=>e.type==='source_bus'&&Number.isFinite(e.max_length_skew)).map(b=>{const lengths=c.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(t=>ddrRouteLength(t.route));return {name:b.name,skewMm:Math.max(...lengths)-Math.min(...lengths),limitMm:b.max_length_skew}})
for(const ids of units){
 const growth=gain(ids);if(growth<.1)continue
 const before=structuredClone(c),record={signals:ids.map(id=>names.get(id)),growthMm:growth,accepted:false};attempts.push(record)
 for(const id of ids){const t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===id),v=d.find(e=>e.type==='pcb_trace'&&e.source_trace_id===id);t.route=joinedOuter(t,v);delete t.trace_length}
 validator.assertImmutable(c)
 const physical=ids.every(id=>validator.validate(c,c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===id)))
 if(!physical){record.reason='Incremental native physical rejection';c=before;console.log(JSON.stringify(record));continue}
 const trial=root+'/trial-'+attempts.length;fs.mkdirSync(trial)
 const source=trial+'/input.circuit.json';fs.writeFileSync(source,JSON.stringify(c,null,2)+'\n')
 const fd=fs.openSync(trial+'/fill.log','wx');let exit=0
 try{execFileSync(process.execPath,['scripts/refill-g350-native-ground-diagnostic.mjs',source,trial+'/filled'],{stdio:['ignore',fd,fd],timeout:90000})}catch(e){exit=e.status??1}finally{fs.closeSync(fd)}
 record.fillExit=exit;assert.equal(exit,0,'Unexpected diagnostic failure must not be hidden')
 const report=read(trial+'/filled/report.json');record.groundPortErrors=report.portErrors
 if(report.portErrors===0){record.accepted=true;record.reason='Fresh native ground membership retained'}else{record.reason='Ground disconnected';c=before}
 const archive=[]
 for(const p of [source,trial+'/filled/candidate.circuit.json',trial+'/filled/problem.json']){const bytes=fs.readFileSync(p),gz=gzipSync(bytes);assert.equal(sha(gunzipSync(gz)),sha(bytes));fs.writeFileSync(p+'.gz',gz);archive.push({path:p,sha256:sha(bytes),archive:p+'.gz',archiveSha256:sha(gz)});fs.unlinkSync(p)}
 fs.writeFileSync(trial+'/archive.json',JSON.stringify(archive,null,2)+'\n')
 fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n');fs.writeFileSync(root+'/progress.json',JSON.stringify({attempts,groups:groups(),planningOnly:true,fabricationReady:false},null,2)+'\n');console.log(JSON.stringify(record))
}
const counts=validator.complete(c);assert(Object.values(counts).every(n=>!n))
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:sha(fs.readFileSync(input))},donor:{path:donor,sha256:sha(fs.readFileSync(donor))},candidateSha256:sha(fs.readFileSync(root+'/candidate.circuit.json')),attempts,groups:groups(),counts,planningOnly:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n')
