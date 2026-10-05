import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Remove the positive strobe's redundant inward tuning turn. The two retained
// native channel sections and RAM repairs supply the rest of the interconnect.
// Other nets and every existing/new hole remain fixed. Independent DRC follows.
const [priorPath,path]=process.argv.slice(2);assert(priorPath&&path)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const provenancePath=priorPath.replace(/\.json$/,'.provenance.json'),prior=read(provenancePath)
for(const a of [prior.source,prior.paths,prior.nativeBootstrap,prior.ramTailRun,prior.ramTails])assert.equal(hash(a.path),a.sha256)
const paths=read(priorPath),p=paths.DDR_DQS1,original=structuredClone(p)
const a=p.findIndex(p=>Math.abs(p.x-10.723902814004635)<1e-8&&Math.abs(p.y+13.97236)<1e-8)
const b=p.findIndex(p=>Math.abs(p.x-10.723902814004635)<1e-8&&Math.abs(p.y+14.90324)<1e-8)
assert(a>0&&b>a);assert(p.slice(a,b+1).every(p=>!p.via));assert(Math.abs(p[a].x-p[b].x)<1e-8)
const input=read(read(prior.manualRamEscape.bootstrap.path).input.path),source=read(prior.source.path)
const shapes=[],width=.1016,clearance=.1016,guard=.003
for(const o of input.obstacles)if(!o.connectedTo?.includes('source_trace_28'))shapes.push({kind:o.shape==='circle'?'circle':'rect',
  x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers})
for(const t of input.traces)for(let i=0;i<t.route.length;i++){
  const q=t.route[i]
  if(q.route_type==='via')shapes.push({kind:'circle',x:q.x,y:q.y,w:q.via_diameter,h:q.via_diameter,layers:['top','inner1','inner2','bottom']})
  if(i){const r=t.route[i-1];if(Math.hypot(r.x-q.x,r.y-q.y)>1e-8)shapes.push({kind:'segment',a:r,b:q,w:Math.max(r.width??width,q.width??width),layers:[r.route_type==='wire'?r.layer:q.layer]})}
}
for(const v of source.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,layers:['top','inner1','inner2','bottom']})
let layer='top'
for(let i=0;i<paths.DDR_DQSn1.length;i++){
  const q=paths.DDR_DQSn1[i]
  if(q.via){shapes.push({kind:'circle',x:q.x,y:q.y,w:.4572,h:.4572,layers:['top','inner1','inner2','bottom']});layer=q.toLayer}
  if(i){const r=paths.DDR_DQSn1[i-1];if(Math.hypot(r.x-q.x,r.y-q.y)>1e-8)shapes.push({kind:'segment',a:r,b:q,w:width,layers:[r.via?r.toLayer:layer]})}
}
const distance=(s,x,y)=>{
  if(s.kind==='circle')return Math.hypot(x-s.x,y-s.y)-s.w/2
  if(s.kind==='rect')return Math.hypot(Math.max(0,Math.abs(x-s.x)-s.w/2),Math.max(0,Math.abs(y-s.y)-s.h/2))
  const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,f=Math.max(0,Math.min(1,((x-s.a.x)*dx+(y-s.a.y)*dy)/(dx*dx+dy*dy)))
  return Math.hypot(x-s.a.x-f*dx,y-s.a.y-f*dy)-s.w/2
}
const samples=Math.ceil(Math.hypot(p[a].x-p[b].x,p[a].y-p[b].y)/.005)
let minimumCopperEdgeGapMm=Infinity
for(let i=0;i<=samples;i++){
  const x=p[a].x+(p[b].x-p[a].x)*i/samples,y=p[a].y+(p[b].y-p[a].y)*i/samples
  for(const s of shapes)if(s.layers.includes('top')){
    const gap=distance(s,x,y)-width/2;minimumCopperEdgeGapMm=Math.min(minimumCopperEdgeGapMm,gap)
    assert(gap>=clearance+guard,`Shortened channel clearance at ${x},${y}: ${gap}`)
  }
}
paths.DDR_DQS1=[...p.slice(0,a+1),...p.slice(b)]
const length=r=>r.slice(1).reduce((s,q,i)=>s+Math.hypot(q.x-r[i].x,q.y-r[i].y),0)
const before=length(original),after=length(paths.DDR_DQS1),negative=length(paths.DDR_DQSn1)
assert(Math.abs(after-negative)<=.127)
const byteNames=Object.keys(paths).filter(n=>/^DDR_D(?:8|9|1[0-5])$/.test(n)||['DDR_DQM1','DDR_DQS1','DDR_DQSn1'].includes(n))
assert.equal(byteNames.length,11)
const byteLengths=byteNames.map(n=>({name:n,planarMm:length(paths[n])}))
const byteSkewMm=Math.max(...byteLengths.map(l=>l.planarMm))-Math.min(...byteLengths.map(l=>l.planarMm))
assert(byteSkewMm<=.635+1e-8)
writeFileSync(path,JSON.stringify(paths,null,2)+'\n')
const repair={kind:'REMOVED_REDUNDANT_POSITIVE_STROBE_INWARD_TUNING_TURN',signal:'DDR_DQS1',
  originalIndices:[a,b],endpoints:[p[a],p[b]],beforePlanarMm:before,afterPlanarMm:after,
  removedLengthMm:before-after,newHoles:0,preservedThroughVias:original.filter(p=>p.via).length,
  wireSamplingStepMm:.005,wireSamplingGuardMm:guard,samples:samples+1,minimumCopperEdgeGapMm,
  pairSkewMm:Math.abs(after-negative),wholeBytePlanarSkewMm:byteSkewMm,byteLengths,
  exactSourceAndIndependentPhysicalChecksRequired:true}
const next={...prior,paths:{path,sha256:hash(path)},
  priorJoinedPaths:{path:priorPath,sha256:hash(priorPath)},priorJoinedProvenance:{path:provenancePath,sha256:hash(provenancePath)},
  manualChannelShortening:repair,lengths:prior.lengths.map(l=>l.name==='DDR_DQS1'?{...l,planarMm:after}:l),
  skewMm:Math.abs(after-negative),timingQualified:false,pairGeometryQualified:false,fabricationReady:false}
writeFileSync(path.replace(/\.json$/,'.provenance.json'),JSON.stringify(next,null,2)+'\n')
console.log(JSON.stringify(repair))
