import {readFileSync, writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Mechanical fit study only. The exact editable outline is exported at 1:1
// without inventing mounting holes or treating outside-case margins as fit.
const outlinePath='mechanical/g350-provisional-outline.json'
const entry=process.argv[2]??JSON.parse(readFileSync('design-status.json','utf8')).currentWork.entry
assert(/^experiments\/am3352-g350-[\w-]+\.circuit\.tsx$/.test(entry),'Expected local G350 placement entry')
const circuitPath=`dist/${entry.replace(/\.circuit\.tsx$/,'')}/circuit.json`
const dxfPath='mechanical/g350-provisional-outline.dxf'
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const geometry=read(outlinePath),circuit=read(circuitPath)
const boards=circuit.filter(x=>x.type==='pcb_board')
assert.equal(boards.length,1)
const board=boards[0]
assert.deepEqual(board.outline,geometry.outline,'Compiled board must use the editable outline')
assert.equal(board.width,geometry.width)
assert.equal(board.height,geometry.height)
assert.equal(board.num_layers,4)
assert.equal(geometry.manufacturingOutlineApproved,false)
assert.deepEqual(geometry.mountingHoles,[])

const points=geometry.outline
const bounds={minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),
 minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))}
assert.equal(bounds.maxX-bounds.minX,geometry.width)
assert.equal(bounds.maxY-bounds.minY,geometry.height)
const signedArea=points.reduce((sum,a,i)=>{
 const b=points[(i+1)%points.length]
 assert(Math.hypot(b.x-a.x,b.y-a.y)>0,'Zero-length outline edge')
 return sum+a.x*b.y-b.x*a.y
},0)/2
assert(Math.abs(signedArea)>0)

// R2000 DXF: closed LWPOLYLINE; millimetres; tscircuit X/Y coordinates.
const pairs=[[0,'SECTION'],[2,'HEADER'],[9,'$ACADVER'],[1,'AC1015'],
 [9,'$INSUNITS'],[70,4],[9,'$MEASUREMENT'],[70,1],[0,'ENDSEC'],
 [0,'SECTION'],[2,'ENTITIES'],[0,'LWPOLYLINE'],[100,'AcDbEntity'],
 [8,'PROVISIONAL_PCB_OUTLINE'],[100,'AcDbPolyline'],[90,points.length],[70,1],
 ...points.flatMap(p=>[[10,p.x],[20,p.y]]),[0,'ENDSEC'],[0,'EOF']]
writeFileSync(dxfPath,pairs.flatMap(p=>p.map(String)).join('\n')+'\n')

// Parse the saved exchange file rather than only checking the input values.
const saved=readFileSync(dxfPath,'utf8').trim().split(/\r?\n/)
const records=[]
for(let i=0;i<saved.length;i+=2)records.push([Number(saved[i]),saved[i+1]])
const start=records.findIndex(([code,value])=>code===0&&value==='LWPOLYLINE')
assert(start>=0)
const entity=records.slice(start+1,records.findIndex((r,i)=>i>start&&r[0]===0))
assert.equal(Number(entity.find(([code])=>code===70)[1]),1,'DXF perimeter must be closed')
assert.equal(Number(entity.find(([code])=>code===90)[1]),points.length)
const exported=[]
for(let i=0;i<entity.length;i++)if(entity[i][0]===10){
 assert.equal(entity[i+1][0],20)
 exported.push({x:Number(entity[i][1]),y:Number(entity[i+1][1])})
}
assert.deepEqual(exported,points,'DXF round trip must preserve the exact perimeter')
const report={status:'PASS_OUTLINE_EXCHANGE_ONLY',fabricationReady:false,
 originalShellFitVerified:false,units:'mm',scale:'1:1',entry,
 dimensionsMm:{width:board.width,height:board.height,thickness:board.thickness,
  mainBodyHeight:geometry.mainBodyHeight,speakerTabWidth:geometry.speakerTongueWidth,
  speakerTabExtension:geometry.speakerTongueExtension},
 boundsMm:bounds,outlineVertices:points.length,closedDxfPerimeter:true,
 exactCompiledOutlinePreserved:true,exactDxfRoundTrip:true,mountingGeometryVerified:false,
 nominalOuterCaseMarginsMm:geometry.nominalCenteredCaseMargin,
 limitation:'Outer-case margins do not establish clearance from internal walls, ribs, posts, ports or membranes.',
 hashes:Object.fromEntries([outlinePath,circuitPath,dxfPath,
  'mechanical/g350-paper-fit-template.svg','scripts/export-g350-fit-outline.mjs'].map(p=>[p,sha(p)]))}
writeFileSync('mechanical/g350-outline-exchange-check.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({...report,hashes:'stored in mechanical/g350-outline-exchange-check.json'},null,2))
