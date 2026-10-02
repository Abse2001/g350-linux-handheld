import {readFileSync,writeFileSync,mkdirSync} from "node:fs"
import {createHash} from "node:crypto"
import assert from "node:assert/strict"

// Source transcription: TI SPRS717L pp15–17 (ZCZ top-view pin maps),
// pp260–261 (0.8mm pitch and 0.4mm land pattern); Micron 4Gb_DDR3L
// Rev Q 12/17 pp17 and27 (x16 ball map, TW 0.8mm grid/0.42mm pads).
// Original JLC imports are retained under ignored reference/am3352/.
const cpuText=readFileSync("reference/am3352/am3352.txt","utf8")
const cpuMap={}
for(const [section,rows] of [["Left","ABCDEF"],["Middle","GHJKLM"],["Right","NPRTUV"]]) {
  const table=cpuText.split(`ZCZPinMap[Section${section}-TopView]`)[1].split("Pin map section location")[0]
  const lines=table.split("\n").filter(l=>/^\d+ /.test(l))
  assert.equal(lines.length,18,`Incomplete ${section} primary table`)
  for(const line of lines) {
    const [column,...signals]=line.trim().split(/\s+/)
    assert.equal(signals.length,6)
    for(let i=0;i<6;i++) cpuMap[`${rows[i]}${column}`]=signals[i]
  }
}
assert.equal(Object.keys(cpuMap).length,324)
const ramRows="ABCDEFGHJKLMNPRT"
const ramColumns=[1,2,3,7,8,9]
const ramTable=[
  "VDDQ DQ13 DQ15 DQ12 VDDQ VSS",
  "VSSQ VDD VSS UDQSn DQ14 VSSQ",
  "VDDQ DQ11 DQ9 UDQS DQ10 VDDQ",
  "VSSQ VDDQ UDM DQ8 VSSQ VDD",
  "VSS VSSQ DQ0 LDM VSSQ VDDQ",
  "VDDQ DQ2 LDQS DQ1 DQ3 VSSQ",
  "VSSQ DQ6 LDQSn VDD VSS VSSQ",
  "VREFDQ VDDQ DQ4 DQ7 DQ5 VDDQ",
  "NC VSS RASn CK VSS NC",
  "ODT VDD CASn CKn VDD CKE",
  "NC CSn WEn A10 ZQ NC",
  "VSS BA0 BA2 NC VREFCA VSS",
  "VDD A3 A0 A12 BA1 VDD",
  "VSS A5 A2 A1 A4 VSS",
  "VDD A7 A9 A11 A6 VDD",
  "VSS RESETn A13 A14 A8 VSS",
]
const ramMap=Object.fromEntries(ramTable.flatMap((line,i)=>line.split(" ").map((signal,j)=>[`${ramRows[i]}${ramColumns[j]}`,signal])))
const hash=t=>createHash("sha256").update(t).digest("hex")
const cpuRows="ABCDEFGHJKLMNPRTUV"
mkdirSync("reference/am3352",{recursive:true})
for(const [path,map,kind] of [["imports/AM3352BZCZ100.tsx",cpuMap,"cpu"],["imports/MT41K256M16TW_107_P.tsx",ramMap,"ram"]]) {
  let text=readFileSync(path,"utf8")
  const rawPath=`reference/am3352/${kind}-supplier-original.tsx`
  try {readFileSync(rawPath)} catch {writeFileSync(rawPath,text)}
  const counts={}
  const entries=[]
  const pinBalls=new Map()
  for(let index=0;index<(kind==="cpu"?324:96);index++) {
    const ball=kind==="cpu" ? `${cpuRows[index%18]}${Math.floor(index/18)+1}` : `${ramRows[index%16]}${ramColumns[Math.floor(index/16)]}`
    const fn=map[ball]
    assert(fn,`Missing ${kind} ${ball}`)
    counts[fn]=(counts[fn]??0)+1
    const repeats=Object.values(map).filter(v=>v===fn).length>1
    const alias=kind==="ram"&&/^A\d+$/.test(fn)?`RAM_${fn}`:repeats?fn+counts[fn]:fn
    entries.push(`  pin${index+1}: ${JSON.stringify([ball,alias])}`)
    pinBalls.set(`pin${index+1}`,ball)
  }
  text=text.replace(/(?:export )?const pinLabels = [\s\S]*? as const/,`export const pinLabels = {\n${entries.join(",\n")}\n} as const`)
  let padCount=0
  text=text.replace(/<smtpad portHints=\{\["(pin\d+)"\]\} pcbX="[-\d.]+mm" pcbY="[-\d.]+mm" radius="[-\d.]+mm" shape="circle" \/>/g,(_,pin)=>{
    const ball=pinBalls.get(pin)
    assert(ball)
    const row=ball[0],column=Number(ball.slice(1))
    const x=kind==="cpu" ? (cpuRows.indexOf(row)-8.5)*.8 : (column-5)*.8
    const y=kind==="cpu" ? (column-9.5)*.8 : (7.5-ramRows.indexOf(row))*.8
    padCount++
    return `<smtpad portHints={["${pin}"]} pcbX="${Number(x.toFixed(4))}mm" pcbY="${Number(y.toFixed(4))}mm" radius="${kind==="cpu"?.2:.21}mm" shape="circle" />`
  })
  assert.equal(padCount,kind==="cpu"?324:96)
  writeFileSync(path,text)
  writeFileSync(`lib/am3352/${kind}-ball-map.json`,JSON.stringify({
    source:kind==="cpu"?"https://www.ti.com/lit/ds/symlink/am3352.pdf":"https://datasheet.lcsc.com/datasheet/pdf/087aaa645ee65877864bf6a18cb1247b.pdf?productCode=C253882",
    sourceDocument:kind==="cpu"?"SPRS717L: ZCZ pin maps pp15–17; ZCZ0324A layout p261":"4Gb_DDR3L Rev Q 12/17: x16 map p17; TW dimensions p27",
    rawSupplierSha256:hash(readFileSync(rawPath)),correctedImportSha256:hash(text),
    pitchMm:.8,padDiameterMm:kind==="cpu"?.4:.42,pins:map,
  },null,2)+"\n")
}
const cpuBall=signal=>Object.entries(cpuMap).find(([,fn])=>fn===signal)?.[0]
const ramNet=signal=>/^DQ\d+$/.test(signal)?`DDR_D${signal.slice(2)}`:
  /^A\d+$|^BA\d+$/.test(signal)?`DDR_${signal}`:
  ({UDM:"DDR_DQM1",LDM:"DDR_DQM0",UDQS:"DDR_DQS1",UDQSn:"DDR_DQSn1",LDQS:"DDR_DQS0",LDQSn:"DDR_DQSn0",CK:"DDR_CK",CKn:"DDR_CKn",ODT:"DDR_ODT",CKE:"DDR_CKE",CSn:"DDR_CSn0",RESETn:"DDR_RESETn",CASn:"DDR_CASn",RASn:"DDR_RASn",WEn:"DDR_WEn"})[signal]
const connections=Object.entries(ramMap).flatMap(([ramBall,ramFunction])=>{
  const name=ramNet(ramFunction)
  const socBall=name?cpuBall(name):undefined
  return name?[{name,socBall,ramBall,ramFunction,
    socPin:`pin${(Number(socBall.slice(1))-1)*18+cpuRows.indexOf(socBall[0])+1}`,
    ramPin:`pin${ramColumns.indexOf(Number(ramBall.slice(1)))*16+ramRows.indexOf(ramBall[0])+1}`}]:[]
})
assert.equal(connections.length,49)
assert(connections.every(c=>c.socBall))
assert.equal(new Set(connections.map(c=>c.name)).size,49)
assert(!connections.some(c=>c.name==="DDR_A15"),"x16 4Gb part uses A0–A14; L7 is A10/AP, M7 is NC")
writeFileSync("lib/am3352/memory-connections.json",JSON.stringify(connections,null,2)+"\n")
console.log("Normalized 324 CPU and 96 DDR3 pads/ball aliases from primary datasheets; 49 shared signal nets.")
