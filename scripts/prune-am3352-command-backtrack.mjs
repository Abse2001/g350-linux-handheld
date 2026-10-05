import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [inputPath,outputPath]=process.argv.slice(2);assert(inputPath&&outputPath)
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const paths=JSON.parse(readFileSync(inputPath)),before=structuredClone(paths)
const route=paths.DDR_A2,near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-6
const index=route.findIndex((a,i)=>a&&!a.via&&near(a,{x:-8.96,y:-18.6})&&
 route[i+1]&&!route[i+1].via&&near(route[i+1],{x:-9,y:-18.6})&&
 route[i+2]&&!route[i+2].via&&near(a,route[i+2]))
assert(index>=0,'Require the exact A2 backtrack identified by KiCad')
route.splice(index+1,2)
// The coarse channel and fine RAM fanout overlap near their handoff.
// Remove same-layer closed loops and return legs. Every replacement lies
// on existing copper; no via or package endpoint may be removed.
let edits=0
for(let changed=true;changed;){
 changed=false
 for(let i=1;i<route.length-1;i++){
  const a=route[i-1],b=route[i],c=route[i+1]
  if(a.via||b.via||c.via)continue
  const ux=b.x-a.x,uy=b.y-a.y,vx=c.x-b.x,vy=c.y-b.y
  if(near(a,b)||Math.abs(ux*vy-uy*vx)<1e-9&&ux*vx+uy*vy< -1e-10){route.splice(i,1);changed=true;break}
 }
 if(changed){assert(++edits<1000);continue}
 for(let i=0;i<route.length-2&&!changed;i++)for(let j=route.length-1;j>i+1;j--){
  if(route.slice(i,j+1).some(p=>p.via))continue
  if(near(route[i],route[j])){route.splice(i+1,j-i);changed=true;break}
 }
 if(changed){assert(++edits<1000);continue}
 for(let i=0;i<route.length-3&&!changed;i++)for(let j=i+2;j<route.length-1;j++){
  if(route.slice(i,j+2).some(p=>p.via))break
  const a=route[i],b=route[i+1],c=route[j],d=route[j+1]
  const ux=b.x-a.x,uy=b.y-a.y,vx=d.x-c.x,vy=d.y-c.y,den=ux*vy-uy*vx
  if(Math.abs(den)<1e-9)continue
  const t=((c.x-a.x)*vy-(c.y-a.y)*vx)/den,u=((c.x-a.x)*uy-(c.y-a.y)*ux)/den
  if(t< -1e-7||t>1+1e-7||u< -1e-7||u>1+1e-7)continue
  const p={x:a.x+t*ux,y:a.y+t*uy}
  route.splice(i+1,j-i,p);changed=true;break
 }
 if(changed)assert(++edits<1000)
}
const length=r=>r.reduce((sum,p,i)=>sum+(i?Math.hypot(p.x-r[i-1].x,p.y-r[i-1].y):0),0)
const removedLength=length(before.DDR_A2)-length(route)
assert(removedLength>=.08-1e-6&&removedLength<10,`Removed ${removedLength} mm in ${edits} loop/return edits`)
assert.deepEqual(route[0],before.DDR_A2[0]);assert.deepEqual(route.at(-1),before.DDR_A2.at(-1))
assert.deepEqual(before.DDR_A2.filter(p=>p.via),route.filter(p=>p.via))
for(const [name,p] of Object.entries(before))if(name!=='DDR_A2')assert.deepEqual(p,paths[name])
writeFileSync(outputPath,JSON.stringify(paths,null,2)+'\n')
const provenance=JSON.parse(readFileSync(inputPath.replace(/\.json$/,'.provenance.json')))
writeFileSync(outputPath.replace(/\.json$/,'.provenance.json'),JSON.stringify({...provenance,
 paths:{path:outputPath,sha256:hash(outputPath)},manualBacktrackCleanup:{
  original:{path:inputPath,sha256:hash(inputPath)},signal:'DDR_A2',removedReturnLengthMm:removedLength,
  removedPoints:before.DDR_A2.length-route.length,removedVias:0,reason:'Independent KiCad flagged the overlapping channel/RAM fanout backtrack at (-9,-18.6).'},
 timingQualified:false,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({signals:Object.keys(paths).length,cleanedSignal:'DDR_A2',removedPoints:before.DDR_A2.length-route.length,removedReturnLengthMm:removedLength,removedVias:0}))
