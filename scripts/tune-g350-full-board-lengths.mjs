import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {tuneOneG350DdrTrace,ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
const [input,root,secondsText='8',stepText='6']=process.argv.slice(2);assert(input&&root&&!fs.existsSync(root));fs.mkdirSync(root,{recursive:true});const seconds=Number(secondsText),step=Number(stepText);assert(seconds>0&&seconds<=60&&step>0)
fs.copyFileSync('scripts/tune-g350-full-board-lengths.mjs',root+'/worker.executed.mjs');fs.copyFileSync('scripts/lib/g350-full-board-length-tuning.mjs',root+'/tuning-helper.executed.mjs');
let circuit=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'));const baseline=structuredClone(circuit)
const names=new Map(circuit.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name]));const buses=circuit.filter(e=>e.type==='source_bus'&&['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(e.name));const pairs=[['DDR_DQS0','DDR_DQSn0'],['DDR_DQS1','DDR_DQSn1'],['DDR_CK','DDR_CKn']];const attempts=[];const selected=process.env.G350_LENGTH_SIGNALS?.split(',');if(selected)assert(selected.every(n=>buses.some(b=>b.source_trace_ids.some(id=>names.get(id)===n))), 'Unknown DDR bus member')
const groups=()=>buses.map(b=>{const rows=circuit.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(t=>({name:names.get(t.source_trace_id),lengthMm:ddrRouteLength(t.route)}));return {name:b.name,rows,skewMm:Math.max(...rows.map(r=>r.lengthMm))-Math.min(...rows.map(r=>r.lengthMm)),limitMm:b.max_length_skew}})
const persist=()=>{fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(circuit,null,2)+'\n');fs.writeFileSync(root+'/report.json',JSON.stringify({inputSha256:createHash('sha256').update(fs.readFileSync(input)).digest('hex'),attempts,groups:groups(),skewErrors:checks.checkPcbBusLengthSkew(circuit),fabricationReady:false,requiresIndependentAndFreshSourceValidation:true},null,2)+'\n')}
for(const bus of buses){
 const members=circuit.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id));const goal=Math.max(...members.map(t=>ddrRouteLength(t.route)))
 const units=members.filter(t=>!pairs.some(p=>p.includes(names.get(t.source_trace_id)))).map(t=>[t.source_trace_id]);for(const pair of pairs){const ids=members.filter(t=>pair.includes(names.get(t.source_trace_id))).map(t=>t.source_trace_id);if(ids.length===2)units.push(ids)}
 units.sort((a,b)=>ddrRouteLength(circuit.find(t=>t.type==='pcb_trace'&&t.source_trace_id===a[0]).route)-ddrRouteLength(circuit.find(t=>t.type==='pcb_trace'&&t.source_trace_id===b[0]).route))
 for(const ids of units){if(selected&&!ids.some(id=>selected.includes(names.get(id))))continue;const before=structuredClone(circuit);const targets=ids.map(id=>{const t=circuit.find(t=>t.type==='pcb_trace'&&t.source_trace_id===id);return Math.min(goal,ddrRouteLength(t.route)+step)});if(targets.every((v,i)=>v-ddrRouteLength(circuit.find(t=>t.type==='pcb_trace'&&t.source_trace_id===ids[i]).route)<.05))continue
 const rows=[];let accepted=true
 for(const [i,id]of ids.entries()){const t=circuit.find(t=>t.type==='pcb_trace'&&t.source_trace_id===id);const old=ddrRouteLength(t.route);const result=tuneOneG350DdrTrace(circuit,t,targets[i],seconds);accepted&&=result.found;rows.push({name:names.get(id),beforeMm:old,afterMm:ddrRouteLength(t.route),targetMm:targets[i],...result})}
 if(ids.length===2){const mm=ids.map(id=>ddrRouteLength(circuit.find(t=>t.type==='pcb_trace'&&t.source_trace_id===id).route));accepted&&=Math.abs(mm[0]-mm[1])<=.127}
 if(!accepted)circuit=before
 attempts.push({bus:bus.name,accepted,rows});persist();console.log(JSON.stringify(attempts.at(-1)))
 }
}
assert.deepEqual(circuit.filter(e=>e.type==='pcb_component'),baseline.filter(e=>e.type==='pcb_component'));persist();console.log(JSON.stringify({accepted:attempts.filter(a=>a.accepted).length,skews:groups().map(g=>[g.name,g.skewMm])}))
