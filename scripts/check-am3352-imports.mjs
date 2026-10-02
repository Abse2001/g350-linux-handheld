import {readFileSync,writeFileSync} from "node:fs"
import {createHash} from "node:crypto"
import assert from "node:assert/strict"

const hash=b=>createHash("sha256").update(b).digest("hex")
const parts=[]
const partLabels={}
for(const [stem,path,count,rows,pitch,diameter] of [
  ["cpu","imports/AM3352BZCZ100.tsx",324,"ABCDEFGHJKLMNPRTUV",.8,.4],
  ["ram","imports/MT41K256M16TW_107_P.tsx",96,"ABCDEFGHJKLMNPRT",.8,.42],
]) {
  const raw=readFileSync(path),text=raw.toString()
  const labels=JSON.parse(text.split("const pinLabels = ")[1].split(" as const")[0].replace(/\b(pin\d+):/g,'"$1":'))
  const map=JSON.parse(readFileSync(`lib/am3352/${stem}-ball-map.json`))
  partLabels[stem]=labels
  const pads=[...text.matchAll(/<smtpad portHints=\{\["(pin\d+)"\]\} pcbX="([-\d.]+)mm" pcbY="([-\d.]+)mm" radius="([-\d.]+)mm"/g)]
    .map(([,pin,x,y,r])=>({pin,ball:labels[pin][0],x:Number(x),y:Number(y),diameter:2*Number(r)}))
  assert.equal(pads.length,count)
  assert.equal(Object.keys(labels).length,count)
  assert.equal(new Set(pads.map(p=>p.ball)).size,count)
  assert.deepEqual(pads.map(p=>p.ball).sort(),Object.keys(map.pins).sort())
  assert.equal(hash(raw),map.correctedImportSha256,"Import changed after primary-source normalization")
  for(const p of pads) {
    const fn=map.pins[p.ball]
    assert(labels[p.pin].some(l=>l===fn||l===`RAM_${fn}`||l.startsWith(fn)&&/^\d+$/.test(l.slice(fn.length))),`${stem} function ${p.ball}`)
    const row=rows.indexOf(p.ball[0]),column=Number(p.ball.slice(1))
    const expected=stem==="cpu" ? {x:(row-8.5)*pitch,y:(column-9.5)*pitch} : {x:(column-5)*pitch,y:(7.5-row)*pitch}
    assert(Math.hypot(p.x-expected.x,p.y-expected.y)<1e-6,`${stem} grid ${p.ball}`)
    assert(Math.abs(p.diameter-diameter)<1e-6,`${stem} pad size ${p.ball}`)
  }
  parts.push({part:stem,supplier:stem==="cpu"?"C468247":"C253882",pads:count,sha256:hash(raw),source:map.source,sourceDocument:map.sourceDocument,
    status:"ALL_BALL_FUNCTIONS_AND_NOMINAL_GRID_CHECKED",solderMaskQualification:"Pending full assembly/manufacturing review"})
}
const cpu=JSON.parse(readFileSync("lib/am3352/cpu-ball-map.json")).pins
const ram=JSON.parse(readFileSync("lib/am3352/ram-ball-map.json")).pins
const connections=JSON.parse(readFileSync("lib/am3352/memory-connections.json"))
assert.equal(connections.length,49)
for(const key of ["name","socBall","ramBall"])assert.equal(new Set(connections.map(c=>c[key])).size,49)
for(const c of connections) {
  assert.equal(cpu[c.socBall],c.name)
  assert.equal(ram[c.ramBall],c.ramFunction)
  assert.equal(partLabels.cpu[c.socPin][0],c.socBall)
  assert.equal(partLabels.ram[c.ramPin][0],c.ramBall)
}
assert.equal(ram.M7,"NC")
assert.equal(ram.L7,"A10")
assert(connections.some(c=>c.name==="DDR_A14")&&!connections.some(c=>c.name==="DDR_A15"))
const report={status:"AM3352_IMPORTS_PASS_HOST_INCOMPLETE",parts,memorySignals:49,ramBytes:536870912,
  requiredSupply:"DDR3-compatible VDD=VDDQ=1.5V; AM3352 VDDS_DDR remains a separate CPU domain",
  fabricationReady:false}
writeFileSync("checks/integrated/am3352-import-validation.json",JSON.stringify(report,null,2)+"\n")
console.log(JSON.stringify({status:report.status,physicalPads:420,memorySignals:49}))
