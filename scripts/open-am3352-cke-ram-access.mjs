import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Open the CKE interstitial via on both outer layers. Retain all holes and
// endpoints, and compensate the data-tail detour with a checked channel shortcut.
const [path]=process.argv.slice(2);assert(path)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const summaryPath='checks/integrated/am3352-ddr-usbc-repaired-strobes-check-summary.json',summary=read(summaryPath)
const preparationPath='dist/am3352-ddr25-address-control-top-prep-attempt-449/result.json',prep=read(preparationPath)
for(const a of [summary.source,summary.paths,prep.source,prep.input])assert.equal(hash(a.path),a.sha256)
assert.deepEqual(prep.source,summary.source)
const input=read(prep.input.path),paths=read(summary.paths.path),original=structuredClone(paths.DDR_DQSn1)
assert.equal(input.traces.length,127);assert.equal(input.layerCount,4)
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,912)
const a=original.findIndex(p=>Math.abs(p.x-4)<1e-8&&Math.abs(p.y+27.1)<1e-8)
const b=original.findIndex(p=>Math.abs(p.x-3.58)<1e-8&&Math.abs(p.y+29.1)<1e-8)
assert(a>=0&&b>a);assert(original.slice(a,b+1).every(p=>!p.via))
const replacement=[original[a],{x:4,y:-28.1},{x:3.58,y:-28.52},original[b]]
paths.DDR_DQSn1=[...original.slice(0,a),...replacement,...original.slice(b+1)]
const source=read(summary.source.path),shapes=[]
const append=t=>{
  for(const [i,p] of t.route.entries()){
    if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.via_hole_diameter,
      layers:['top','inner1','inner2','bottom'],owners:[t.source_trace_id],label:t.pcb_trace_id})
    if(i){const q=t.route[i-1];if(Math.hypot(q.x-p.x,q.y-p.y)>1e-8)shapes.push({kind:'segment',a:q,b:p,w:Math.max(q.width??.1016,p.width??.1016),
      layers:[q.route_type==='wire'?q.layer:p.layer],owners:[t.source_trace_id],label:t.pcb_trace_id})}
  }
}
for(const o of input.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,
  layers:o.layers,owners:o.connectedTo??[],pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,label:o.circuitJsonMetadata?.pcb_smtpad_id??o.circuitJsonMetadata?.pcb_via_id})
for(const t of input.traces)if(t.source_trace_id!=='source_trace_27')append(t)
for(const v of source.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,
  layers:['top','inner1','inner2','bottom'],owners:[source.find(t=>t.type==='pcb_trace'&&t.pcb_trace_id===v.pcb_trace_id)?.source_trace_id].filter(Boolean),label:v.pcb_via_id})
const distance=(s,p)=>{
  if(s.kind==='circle')return Math.hypot(p.x-s.x,p.y-s.y)-s.w/2
  if(s.kind==='rect')return Math.hypot(Math.max(0,Math.abs(p.x-s.x)-s.w/2),Math.max(0,Math.abs(p.y-s.y)-s.h/2))
  const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,f=Math.max(0,Math.min(1,((p.x-s.a.x)*dx+(p.y-s.a.y)*dy)/(dx*dx+dy*dy)))
  return Math.hypot(p.x-s.a.x-f*dx,p.y-s.a.y-f*dy)-s.w/2
}
const sample=(route,layer,owner)=>{
  let count=0,minimumCopperEdgeGapMm=Infinity
  for(let i=1;i<route.length;i++){
    const a=route[i-1],b=route[i],n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/.005))
    const relevant=shapes.filter(s=>s.layers.includes(layer)&&!s.owners.includes(owner)).filter(s=>{
      const left=s.kind==='segment'?Math.min(s.a.x,s.b.x)-s.w/2:s.x-s.w/2
      const right=s.kind==='segment'?Math.max(s.a.x,s.b.x)+s.w/2:s.x+s.w/2
      const top=s.kind==='segment'?Math.min(s.a.y,s.b.y)-s.w/2:s.y-s.h/2
      const bottom=s.kind==='segment'?Math.max(s.a.y,s.b.y)+s.w/2:s.y+s.h/2
      return right>=Math.min(a.x,b.x)-.2&&left<=Math.max(a.x,b.x)+.2&&bottom>=Math.min(a.y,b.y)-.2&&top<=Math.max(a.y,b.y)+.2
    })
    for(let j=0;j<=n;j++){
      const p={x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n}
      for(const s of relevant){const gap=distance(s,p)-.0508;minimumCopperEdgeGapMm=Math.min(minimumCopperEdgeGapMm,gap)
        assert(gap>=.1016+.003-1e-8,`${owner} copper clearance ${gap} at ${p.x},${p.y} against ${s.label}`)}
      count++
    }
  }
  return {samples:count,minimumCopperEdgeGapMm}
}
const movedStrobePreflight=sample(replacement,'top','source_trace_27')
const asTrace=(path,owner)=>{let layer='top';return {pcb_trace_id:`authored_${owner}`,source_trace_id:owner,route:path.map(p=>{
  if(p.via){layer=p.toLayer;return {...p,route_type:'via',from_layer:p.fromLayer,to_layer:p.toLayer,via_diameter:.4572,via_hole_diameter:.254}}
  return {...p,route_type:'wire',layer,width:.1016}
})}}
append(asTrace(paths.DDR_DQSn1,'source_trace_27'))
const dataOriginal=structuredClone(paths.DDR_D7),data=paths.DDR_D7
const da=data.findIndex(p=>Math.abs(p.x-4.56)<1e-8&&Math.abs(p.y+28.44)<1e-8)
const db=data.findIndex(p=>Math.abs(p.x-2.7)<1e-8&&Math.abs(p.y+27.4)<1e-8)
assert(da>=0&&db>da)
const dataTail=[data[da],{x:3.48,y:-28.18},{x:3.32,y:-28.08},{x:3.2,y:-27.9},{x:3.2,y:-27.4},data[db]]
const dataTailPreflight=sample(dataTail,'bottom','source_trace_32')
paths.DDR_D7=[...data.slice(0,da),...dataTail,...data.slice(db+1)]
// Remove only this net's old wire copper before the prospective CKE check.
for(let i=shapes.length-1;i>=0;i--)if(shapes[i].kind==='segment'&&shapes[i].owners.includes('source_trace_32'))shapes.splice(i,1)
// Search existing channel vertices for a legal, shorter straight segment. No
// pad, via, endpoint or other net is moved, and every new segment is sampled.
const length=r=>r.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-r[i].x,p.y-r[i].y),0)
const requiredSaving=length(paths.DDR_D7)-length(dataOriginal)+.01
const shortcuts=[];let layer='top'
const layers=paths.DDR_D7.map(p=>{if(p.via)layer=p.toLayer;return layer})
for(let i=0;i<da;i++)for(let j=i+2;j<Math.min(da,paths.DDR_D7.length);j++){
  const part=paths.DDR_D7.slice(i,j+1)
  if(part.some(p=>p.via)||layers[i]!==layers[j])continue
  const straight=[part[0],part.at(-1)],saving=length(part)-length(straight)
  if(saving<requiredSaving)continue
  try{const preflight=sample(straight,layers[i],'source_trace_32');shortcuts.push({indices:[i,j],saving,preflight,straight})}catch{}
}
shortcuts.sort((a,b)=>a.saving-b.saving)
let shortcut=shortcuts[0]
if(!shortcut){
  const route=paths.DDR_D7,dp=[{length:0,previous:-1}],preflights=new Map()
  for(let j=1;j<=da;j++){
    dp[j]={length:dp[j-1].length+length([route[j-1],route[j]]),previous:j-1}
    for(let i=0;i<j-1;i++){
      const part=route.slice(i,j+1)
      if(part.some(p=>p.via)||layers[i]!==layers[j])continue
      const candidate=dp[i].length+length([route[i],route[j]])
      if(candidate>=dp[j].length-.0001)continue
      try{const preflight=sample([route[i],route[j]],layers[i],'source_trace_32');dp[j]={length:candidate,previous:i};preflights.set(`${i}:${j}`,preflight)}catch{}
    }
  }
  const retained=[da]
  while(retained[0]>0)retained.unshift(dp[retained[0]].previous)
  const saving=length(route.slice(0,da+1))-dp[da].length
  console.log(JSON.stringify({legalDataTail:true,requiredSaving,availableTautPathSaving:saving}))
  assert(saving>=requiredSaving,'No legal D7 combined channel shortcuts compensate the tail')
  shortcut={retainedIndices:retained,saving,preflights:retained.slice(1).map((j,k)=>({from:retained[k],to:j,...preflights.get(`${retained[k]}:${j}`)})).filter(p=>p.to-p.from>1)}
  paths.DDR_D7=[...retained.map(i=>route[i]),...route.slice(da+1)]
}else paths.DDR_D7=[...paths.DDR_D7.slice(0,shortcut.indices[0]+1),...paths.DDR_D7.slice(shortcut.indices[1])]
append(asTrace(paths.DDR_D7,'source_trace_32'))
const cke=prep.definitions.find(d=>d.name==='DDR_CKE').pointsToConnect[1]
assert(Math.hypot(cke.x-3.2,cke.y+28.2)<1e-8)
const tip={x:3.6,y:-27.8},futureRoute=[{x:cke.x,y:cke.y},tip]
const futureCkeWirePreflight=sample(futureRoute,'top','source_trace_48')
let minimumPadHoleGapMm=Infinity,minimumHoleEdgeGapMm=Infinity,minimumViaCopperGapMm=Infinity
for(const s of shapes){
  const d=distance(s,tip)
  if(!s.owners.includes('source_trace_48')){minimumViaCopperGapMm=Math.min(minimumViaCopperGapMm,d-.2286);assert(d-.2286>=.1016-1e-8,`CKE via copper ${s.label}`)}
  if(s.pad){minimumPadHoleGapMm=Math.min(minimumPadHoleGapMm,d-.127);assert(d-.127>=.2-1e-8,`CKE pad-to-hole ${s.label}`)}
  if(s.hole){const gap=Math.hypot(tip.x-s.x,tip.y-s.y)-.127-s.hole/2;minimumHoleEdgeGapMm=Math.min(minimumHoleEdgeGapMm,gap);assert(gap>=.254-1e-8,`CKE hole separation ${s.label}`)}
}
const negative=length(paths.DDR_DQSn1),positive=length(paths.DDR_DQS1),skew=Math.abs(negative-positive)
assert(skew<=.127)
const byte=Object.entries(paths).filter(([n])=>/^DDR_D(?:8|9|1[0-5])$/.test(n)||['DDR_DQM1','DDR_DQS1','DDR_DQSn1'].includes(n))
assert.equal(byte.length,11)
const byteSkew=Math.max(...byte.map(([,p])=>length(p)))-Math.min(...byte.map(([,p])=>length(p)))
assert(byteSkew<=.635+1e-8)
const byte0=Object.entries(paths).filter(([n])=>/^DDR_D[0-7]$/.test(n)||['DDR_DQM0','DDR_DQS0','DDR_DQSn0'].includes(n))
assert.equal(byte0.length,11)
const byte0Skew=Math.max(...byte0.map(([,p])=>length(p)))-Math.min(...byte0.map(([,p])=>length(p)))
assert(byte0Skew<=.635+1e-8)
writeFileSync(path,JSON.stringify(paths,null,2)+'\n')
const provenance={source:summary.source,priorPaths:summary.paths,priorCheckedSummary:{path:summaryPath,sha256:hash(summaryPath)},
  paths:{path,sha256:hash(path)},preparation:{path:preparationPath,sha256:hash(preparationPath)},
  manualModification:{kind:'MOVED_RAM_NEGATIVE_STROBE_ELBOW_TO_OPEN_CKE',signal:'DDR_DQSn1',originalIndices:[a,b],replacement,
    changedTracePieces:2,newHoles:0,priorNegativePlanarMm:length(original),negativePlanarMm:negative,positivePlanarMm:positive,
    strobeSkewMm:skew,byteSkewMm:byteSkew,movedStrobePreflight,wireSamplingStepMm:.005,wireSamplingGuardMm:.003},
  manualDataTailModification:{signal:'DDR_D7',sourceTraceId:'source_trace_32',originalIndices:[da,db],replacement:dataTail,dataTailPreflight,
    channelShortcut:shortcut,priorPlanarMm:length(dataOriginal),planarMm:length(paths.DDR_D7),byte0SkewMm:byte0Skew,newHoles:0},
  futureCkeEscape:{fromActualRamPad:cke,tip,landMm:.4572,drillMm:.254,futureCkeWirePreflight,
    minimumPadHoleGapMm,minimumHoleEdgeGapMm,minimumViaCopperGapMm,actuallyExported:false,nativeGenerated:false},
  nativeBusLanesBootstrap:true,referenceLayersReserved:['inner1','inner2'],copperLayers:4,
  independentSourceAndPhysicalChecksRequired:true,fabricationReady:false}
writeFileSync(path.replace(/\.json$/,'.provenance.json'),JSON.stringify(provenance,null,2)+'\n')
console.log(JSON.stringify(provenance))
