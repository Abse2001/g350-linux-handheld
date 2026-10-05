import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {selectCheckedCommandSummary,readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

// Exact line/capsule interval unions measure the routed length exposed to
// inter-net DDR spacing below TI's normal 3w/4w rule. This partial audit does
// not select impedance, qualify pair coupling or inspect reference plane cuts.
const [sourcePath,reportPath]=process.argv.slice(2);assert(sourcePath&&reportPath)
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),read=p=>JSON.parse(readFileSync(p))
const checked=selectCheckedCommandSummary(artifact(sourcePath)),{summary}=readCheckedCommandSummary(checked)
const source=read(sourcePath),logical=source.filter(t=>t.type==='source_trace'),mapping=read(summary.memoryMap.path)
const cls=n=>/^DDR_DQS[n]?0$/.test(n)?'DQS0':/^DDR_DQS[n]?1$/.test(n)?'DQS1':/^DDR_CKn?$/.test(n)?'CK':/^DDR_D[0-7]$|^DDR_DQM0$/.test(n)?'DQ0':/^DDR_D(8|9|1[0-5])$|^DDR_DQM1$/.test(n)?'DQ1':n==='DDR_RESETn'?'ASYNC':'ADDR_CTRL'
const segments=[]
for(const t of source.filter(t=>t.type==='pcb_trace')){
 const name=logical.find(s=>s.source_trace_id===t.source_trace_id)?.name;if(!mapping.some(m=>m.name===name))continue
 for(let i=1;i<t.route.length;i++){
  const a=t.route[i-1],b=t.route[i],length=Math.hypot(b.x-a.x,b.y-a.y);if(length<1e-10)continue
  const layer=a.route_type==='wire'?a.layer:a.to_layer;assert.equal(layer,b.route_type==='wire'?b.layer:b.from_layer)
  const width=Math.max(a.width??.1016,b.width??.1016);assert.equal(width,.1016)
  segments.push({name,netClass:cls(name),pcbTraceId:t.pcb_trace_id,a:{x:a.x,y:a.y},b:{x:b.x,y:b.y},layer,length,width})
 }
}
const dot=(a,b)=>a.x*b.x+a.y*b.y,sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y})
const intersect=(a,b)=>{const lo=Math.max(a[0],b[0]),hi=Math.min(a[1],b[1]);return hi>lo+1e-12?[lo,hi]:null}
const linearRange=(constant,slope,lo,hi)=>{
 if(Math.abs(slope)<1e-14)return constant>=lo&&constant<=hi?[0,1]:null
 const a=(lo-constant)/slope,b=(hi-constant)/slope;return intersect([Math.min(a,b),Math.max(a,b)],[0,1])
}
const quadraticRange=(a,b,c)=>{
 if(Math.abs(a)<1e-14){if(Math.abs(b)<1e-14)return c<=0?[0,1]:null;return intersect(b>0?[-Infinity,-c/b]:[-c/b,Infinity],[0,1])}
 const discriminant=b*b-4*a*c;if(discriminant<0)return null
 const s=Math.sqrt(Math.max(0,discriminant));return intersect([(-b-s)/(2*a),(-b+s)/(2*a)],[0,1])
}
function nearIntervals(s,t,r){
 const v=sub(s.b,s.a),u=sub(t.b,t.a),p=sub(s.a,t.a),u2=dot(u,u),out=[]
 const q0=dot(p,u)/u2,q1=dot(v,u)/u2
 const interior=linearRange(q0,q1,0,1)
 if(interior){const cross0=p.x*u.y-p.y*u.x,cross1=v.x*u.y-v.y*u.x;const close=quadraticRange(cross1*cross1,2*cross0*cross1,cross0*cross0-r*r*u2);if(close){const range=intersect(interior,close);if(range)out.push(range)}}
 for(const [endpoint,projection] of [[t.a,linearRange(q0,q1,-Infinity,0)],[t.b,linearRange(q0,q1,1,Infinity)]])if(projection){const z=sub(s.a,endpoint),close=quadraticRange(dot(v,v),2*dot(z,v),dot(z,z)-r*r);if(close){const range=intersect(close,projection);if(range)out.push(range)}}
 return out
}
const union=intervals=>{const out=[];for(const r of intervals.sort((a,b)=>a[0]-b[0])){const last=out.at(-1);if(last&&r[0]<=last[1]+1e-10)last[1]=Math.max(last[1],r[1]);else out.push([...r])}return out}
// Known geometric cases: full parallel exposure, no exposure, and an endpoint
// circle whose exact intersection is [0.375, 0.625] on a 4 mm line.
const test={a:{x:0,y:0},b:{x:4,y:0}},parallel={a:{x:0,y:.2},b:{x:4,y:.2}}
assert.deepEqual(union(nearIntervals(test,parallel,.3)),[[0,1]])
assert.deepEqual(nearIntervals(test,parallel,.1),[])
const endpoint={a:{x:2,y:0},b:{x:2,y:1}};assert.deepEqual(union(nearIntervals(test,endpoint,.5)),[[.375,.625]])
const records=new Map(mapping.filter(m=>source.some(t=>t.type==='pcb_trace'&&t.source_trace_id===logical.find(s=>s.name===m.name)?.source_trace_id)).map(m=>[m.name,{name:m.name,netClass:cls(m.name),planarMm:0,reducedSpacingExposureMm:0,normalSpacingMultipliers:[],neighbors:new Set()}]))
const excludedPairs=[]
for(const s of segments){
 const intervals=[],record=records.get(s.name);record.planarMm+=s.length
 for(const t of segments){
  if(s.name===t.name||s.layer!==t.layer)continue
  if(['CK','DQS0','DQS1'].includes(s.netClass)&&s.netClass===t.netClass){excludedPairs.push(s.netClass);continue}
  const multiplier=s.netClass===t.netClass&&['DQ0','DQ1','ADDR_CTRL'].includes(s.netClass)?3:4,r=multiplier*Math.max(s.width,t.width)
  if(Math.max(s.a.x,s.b.x)+r<Math.min(t.a.x,t.b.x)||Math.max(t.a.x,t.b.x)+r<Math.min(s.a.x,s.b.x)||Math.max(s.a.y,s.b.y)+r<Math.min(t.a.y,t.b.y)||Math.max(t.a.y,t.b.y)+r<Math.min(s.a.y,s.b.y))continue
  const exposure=nearIntervals(s,t,r-1e-9);if(exposure.length){intervals.push(...exposure);record.neighbors.add(t.name);record.normalSpacingMultipliers.push(multiplier)}
 }
 record.reducedSpacingExposureMm+=union(intervals).reduce((n,[lo,hi])=>n+(hi-lo)*s.length,0)
}
const results=[...records.values()].map(r=>({...r,neighbors:[...r.neighbors].sort(),normalSpacingMultipliers:[...new Set(r.normalSpacingMultipliers)].sort(),exceptionLengthLimitMm:31.75,reducedSpacingLengthPass:r.reducedSpacingExposureMm<=31.75+1e-8})).sort((a,b)=>a.name.localeCompare(b.name))
for(const r of results){const p=read(summary.planarDdrAudit.path).results.find(t=>t.name===r.name);assert(Math.abs(p.planarLengthMm-r.planarMm)<1e-7,'Copper self-contact or unexpected length requires separate analysis')}
const problems=results.filter(r=>!r.reducedSpacingLengthPass).map(r=>`${r.name}: ${r.reducedSpacingExposureMm.toFixed(6)} mm below normal class spacing exceeds 31.75 mm allowance`)
const report={status:problems.length?'PARTIAL_DDR_CLASS_SPACING_FAIL':'PARTIAL_DDR_CLASS_SPACING_EXPOSURE_WITHIN_LENGTH_ALLOWANCE',source:artifact(sourcePath),checkedSummary:checked,executionHelper:artifact('scripts/check-am3352-ddr-class-spacing.mjs'),manufacturerRules:{sourceUrl:'https://www.ti.com/lit/ds/sprs717l/sprs717l.pdf',revision:'SPRS717L',reviewDate:'2026-10-04',tables:['7-61','7-62','7-68','7-69'],sameSignalClassCenterSpacingW:3,otherDdrClassCenterSpacingW:4,reducedSpacingLengthAllowanceMm:31.75,singleEndedImpedanceRangeOhm:[50,75],impedanceToleranceOhm:5},copperLayers:4,traceWidthMm:.1016,connectedSignals:results.length,expectedSignals:49,missingSignals:mapping.filter(m=>!records.has(m.name)).map(m=>m.name),results,problems,method:'Exact line-to-segment capsule intersection; union across all foreign DDR traces separately on each actual signal layer; routed lengths below the normal class spacing are counted once per path location.',excludedDifferentialPairClasses:[...new Set(excludedPairs)].sort(),completeSpacingQualified:false,differentialImpedanceAndCouplingQualified:false,sameNetMeanderCouplingQualified:false,padsAndDrillsCheckedBySeparatePhysicalDrc:true,stackupSupplierConfirmed:false,viaAndPackageDelaysQualified:false,referencePlaneReturnPathsQualified:false,terminationAndOdtQualified:false,fullElectricalTimingQualified:false,originalShellFitVerified:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,connectedSignals:results.length,spacingExposureFailures:problems.length,maxReducedSpacingExposureMm:Math.max(...results.map(r=>r.reducedSpacingExposureMm)),completeSpacingQualified:false,fabricationReady:false}));process.exitCode=problems.length?1:0
