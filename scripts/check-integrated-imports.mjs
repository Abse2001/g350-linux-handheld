import {readFileSync, writeFileSync, mkdirSync} from "node:fs"
import {createHash} from "node:crypto"
import assert from "node:assert/strict"

function importedPart(path) {
  const text = readFileSync(path,"utf8")
  const labelText = text.split("const pinLabels = ")[1].split(" as const")[0]
    .replace(/\b(pin\d+):/g,'"$1":')
  const labels = JSON.parse(labelText)
  const pads = [...text.matchAll(/<smtpad portHints=\{\["(pin\d+)"\]\} pcbX="([-\d.]+)mm" pcbY="([-\d.]+)mm"[^>]*radius="([-\d.]+)mm"/g)]
    .map(([,pin,x,y,r])=>({pin,ball:labels[pin][0],x:Number(x),y:Number(y),diameter:2*Number(r)}))
  return {labels,pads,sha256:createHash("sha256").update(text).digest("hex")}
}
const socMap = JSON.parse(readFileSync("lib/integrated/rk3566-ball-map.json"))
const ramMap = JSON.parse(readFileSync("lib/integrated/hynix-ball-map.json"))
const connections = JSON.parse(readFileSync("lib/integrated/memory-connections.json"))
const soc = importedPart("imports/RK3566.tsx")
const ram = importedPart("imports/H9HCNNN8KUMLHR_NME.tsx")
for(const [part,map,count] of [[soc,socMap,565],[ram,ramMap,200]]) {
  assert.equal(Object.keys(part.labels).length,count)
  assert.equal(part.pads.length,count)
  assert.deepEqual(part.pads.map(p=>p.ball).sort(),Object.keys(map).sort())
  assert.equal(new Set(part.pads.map(p=>p.ball)).size,count)
}
assert.equal(connections.length,67)
assert.equal(new Set(connections.map(c=>c.name)).size,67)
assert.equal(new Set(connections.map(c=>c.socBall)).size,67)
assert.equal(new Set(connections.map(c=>c.ramBall)).size,67)
for(const c of connections) {
  assert(socMap[c.socBall].functions.includes(c.name),`${c.name}: incorrect SoC ball`)
  assert.equal(ramMap[c.ramBall],c.ramFunction,`${c.name}: incorrect RAM ball`)
  assert(!/CS1|CKE1/.test(c.ramFunction),"Single-rank RAM cannot use a second rank")
}
// Manufacturer ball pitches and top-view orientation; supplier mistakes are
// reported independently of trace DRC. Tolerance is 5 µm, not a solder waiver.
const ramRows = ["A","B","C","D","E","F","G","H","J","K","L","M","N","P","R","T","U","V","W","Y","AA","AB"]
const geometryIssues=[]
for(const pad of ram.pads) {
  const [,row,col]=pad.ball.match(/^([A-Z]+)(\d+)$/)
  const expected={x:(Number(col)-6.5)*0.8,y:(10.5-ramRows.indexOf(row))*0.65}
  if(Math.hypot(pad.x-expected.x,pad.y-expected.y)>0.005)
    geometryIssues.push({part:"RAM",ball:pad.ball,actual:{x:pad.x,y:pad.y},expected})
}
// Rockchip FCCSP565: 38x35 peripheral 0.4mm grid, plus 0.65mm inner grid.
// The supplier footprint uses a 0.030/0.015mm local datum offset. It is
// retained here and in the generated escape centres, not silently recentered.
const outerRows=["A","B","C","D","E","F","G","H","J","K","L","M","N","P","R","T","U","V","W","Y","AA","AB","AC","AD","AE","AF","AG","AH","AJ","AK","AL","AM","AN","AP","AR"]
const innerRows=["A","B","C","D","E","F","G","H","J","K","L","M","N","P","R","T","U","V"]
for(const pad of soc.pads) {
  const [,inner,row,col]=pad.ball.match(/^(1?)([A-Z]+)(\d+)$/)
  const pitch=inner?0.65:0.4
  const rows=inner?innerRows:outerRows
  assert(rows.includes(row),`Unknown SoC row ${pad.ball}`)
  const expected={x:(Number(col)-(inner?10.5:19.5))*pitch+0.03,
    y:((rows.length-1)/2-rows.indexOf(row))*pitch+0.015}
  if(Math.hypot(pad.x-expected.x,pad.y-expected.y)>0.005)
    geometryIssues.push({part:"SOC",ball:pad.ball,actual:{x:pad.x,y:pad.y},expected})
}
for(const [name,part] of [["RK3566",soc],["H9HCNNN8KUMLHR_NME",ram]]) {
  const saved=JSON.parse(readFileSync(`lib/integrated/${name}-pad-centres.json`))
  assert.deepEqual(saved,Object.fromEntries(part.pads.map(({pin,...pad})=>[pad.ball,pad])),
    `Regenerate ${name} escape centres after editing its footprint`)
}
const buck=importedPart("imports/RK860_0.tsx")
const buckFunctions=["VSEL","EN","SCL","VOUT","SDA","GND1","GND2","AGND","GND3","GND4","GND5","GND6","VIN1","VIN2","LX1","LX2","VIN3","VIN4","LX3","LX4"]
assert.equal(buck.pads.length,20)
for(let index=0;index<20;index++) {
  const ball=`${"ABCDE"[Math.floor(index/4)]}${index%4+1}`
  assert.deepEqual(buck.labels[`pin${index+1}`],[ball,buckFunctions[index]])
}
const sd=importedPart("imports/TF_013.tsx")
for(const [pin,func] of Object.entries({1:"DAT2",2:"DAT3",3:"CMD",4:"VDD",5:"CLK",6:"VSS",7:"DAT0",8:"DAT1",9:"DETECT1",10:"GND4",11:"DETECT2",12:"GND1",13:"GND3",14:"GND2"}))
  assert(sd.labels[`pin${pin}`].includes(func),`Incorrect SD alias on pad ${pin}`)
const pmic=importedPart("imports/RK817_5.tsx")
const pmicMap=JSON.parse(readFileSync("lib/integrated/rk817-pin-map.json"))
assert.equal(Object.keys(pmic.labels).length,69)
for(const [pin,func] of Object.entries(pmicMap.pins))
  assert(pmic.labels[`pin${pin}`].includes(func),`Incorrect RK817 alias on pad ${pin}`)
const report={status:geometryIssues.length?"BLOCKED_FOOTPRINT_GEOMETRY":"PIN_MAP_AND_CHIP_GRIDS_PASS",
  scope:"Chip ball labels, 67 memory functions, SoC/RAM pad grids, CPU-regulator and PMIC pin functions, and SD contact aliases only; not fabrication qualification",
  soc:{supplier:"C2943786",ballCount:565,sha256:soc.sha256},
  ram:{supplier:"C2912103",ballCount:200,sha256:ram.sha256},
  cpuBuck:{supplier:"C19188628",ballCount:20,sha256:buck.sha256},
  pmic:{supplier:"C5179490",pinCount:69,sha256:pmic.sha256,geometryQualification:"Pending: full pad geometry versus manufacturer drawing"},
  microSD:{supplier:"C444917",sha256:sd.sha256,
    geometryQualification:"Pending: manufacturer drawing/import geometry comparison"},
  sources:{soc:"Rockchip RK3566 datasheet Rev1.2 pp20-30 and RK3566 brief package pitches",
    ram:"Hynix H9HCNNN8KUMLHR-NME manufacturer datasheet p6",
    cpuBuck:"Rockchip RK860 datasheet Rev1.2 p4",
    pmic:pmicMap.source,
    microSD:"SOFNG TF-013 manufacturer drawing p2"},
  memoryConnections:connections.length,geometryIssues}
mkdirSync("checks/integrated",{recursive:true})
writeFileSync("checks/integrated/import-validation.json",JSON.stringify(report,null,2)+"\n")
console.log(JSON.stringify({status:report.status,ballLabels:765,memoryConnections:67,geometryIssues:geometryIssues.length}))
if(geometryIssues.length) process.exitCode=1
