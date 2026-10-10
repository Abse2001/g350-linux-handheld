import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {growG350DdrWindowComb} from './lib/g350-ddr-window-combs.mjs'
import {growG350TranslatedWindow} from './lib/g350-ddr-translated-windows.mjs'
import {ddrRouteLength,tuneOneG350DdrTrace} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
const [input,root,name,incrementText='6',secondsText='30',method='comb']=process.argv.slice(2)
assert(['comb','translate','bend'].includes(method))
assert(input&&root&&name&&!fs.existsSync(root));fs.mkdirSync(root,{recursive:true})
for(const p of ['scripts/try-g350-ddr-window-comb.mjs','scripts/lib/g350-ddr-window-combs.mjs','scripts/lib/g350-ddr-translated-windows.mjs','scripts/lib/g350-ddr-planar-planning-validator.mjs','scripts/lib/g350-full-board-length-tuning.mjs','scripts/lib/g350-ddr-local-guard.mjs','scripts/lib/g350-ddr-physical-checks.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
const inputBytes=fs.readFileSync(input),executedInput=root+'/input.executed.circuit.json'
fs.writeFileSync(executedInput,inputBytes)
const c=JSON.parse(inputBytes).filter(e=>!e.type.includes('error')),before=structuredClone(c),validator=createG350PlanarPlanningValidator(c)
const s=c.find(e=>e.type==='source_trace'&&e.name===name),t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===s?.source_trace_id);assert(t)
const increment=Number(incrementText),seconds=Number(secondsText);assert(increment>0&&increment<=40)
assert(method!=='bend'||increment<=1.2,'This single-trace trial preserves all existing vias')
const planarValidator=(c,t)=>{
 try{validator.assertImmutable(c)}catch{return false}
 return validator.validate(c,t)
}
const lengthBefore=ddrRouteLength(t.route),grow=method==='bend'?tuneOneG350DdrTrace:method==='translate'?growG350TranslatedWindow:growG350DdrWindowComb,result=grow(c,t,lengthBefore+increment,seconds,{planningValidator:planarValidator})
if(!result.found){
 fs.writeFileSync(root+'/rejected-before-rollback.circuit.json',JSON.stringify(c,null,2)+'\n')
 t.route=structuredClone(before.find(e=>e.pcb_trace_id===t.pcb_trace_id).route)
}
if(result.found)delete t.trace_length
const counts=validator.complete(c);assert(Object.values(counts).every(n=>n===0))
assert.deepEqual(t.route.filter(p=>p.route_type==='via'),before.find(e=>e.pcb_trace_id===t.pcb_trace_id).route.filter(p=>p.route_type==='via'))
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
const report={input:executedInput,originalInput:input,inputSha256:createHash('sha256').update(inputBytes).digest('hex'),environment:Object.fromEntries(['G350_LENGTH_SIMPLIFY_SECONDS','G350_LENGTH_MOVE_BENDS','G350_LENGTH_BALANCED_SEARCH'].map(k=>[k,process.env[k]??null])),name,method,increment,seconds,lengthBefore,result,candidateLengthMm:ddrRouteLength(t.route),counts,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false}
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
