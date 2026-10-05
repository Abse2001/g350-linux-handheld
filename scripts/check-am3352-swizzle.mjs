import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const cpu=JSON.parse(readFileSync('lib/am3352/cpu-ball-map.json')).pins
const ram=JSON.parse(readFileSync('lib/am3352/ram-ball-map.json')).pins
const original=JSON.parse(readFileSync('lib/am3352/memory-connections.json'))
const cases=[]
for(const [path,wholeByteSwap,byte1Only] of [
  ['lib/am3352/memory-swizzled-connections.json',false,false],
  ['lib/am3352/memory-byte-swapped-connections.json',true,false],
  ['lib/am3352/memory-byte1-swizzled-connections.json',false,true],
  ['lib/am3352/memory-byte0-guided-swizzled-connections.json',false,false],
  ['lib/am3352/memory-byte0-centered-swizzled-connections.json',false,false],
  ['lib/am3352/memory-byte1-top-centered-swizzled-connections.json',false,false],
]) {
  const raw=readFileSync(path),selected=JSON.parse(raw)
  assert.equal(selected.length,49)
  for(const field of ['name','socPin','socBall','ramPin','ramBall'])assert.equal(new Set(selected.map(c=>c[field])).size,49)
  for(const c of selected) {
    assert.equal(cpu[c.socBall],c.name)
    assert.equal(ram[c.ramBall],c.ramFunction)
    const plain=original.find(p=>p.name===c.name)
    if(byte1Only&&!/^DDR_D(8|9|1[0-5])$/.test(c.name)) {
      assert.deepEqual(c,plain,'Byte1-only permutation must preserve every other connection')
    }
    if(/^DDR_D\d+$/.test(c.name)) {
      const controller=Number(c.name.slice(5)),memory=Number(c.ramFunction.slice(2))
      assert(/^DQ\d+$/.test(c.ramFunction))
      assert.equal(Math.floor(memory/8),Math.floor(controller/8)^(wholeByteSwap?1:0))
    } else if(wholeByteSwap&&/^DDR_DQM[01]$|^DDR_DQS[n]?[01]$/.test(c.name)) {
      const matching=original.find(p=>p.name===c.name.slice(0,-1)+(1-Number(c.name.slice(-1))))
      assert.equal(c.ramBall,matching.ramBall)
      assert.equal(c.ramPin,matching.ramPin)
    } else {
      assert.equal(c.ramBall,plain.ramBall,'Address/command/clock cannot be swizzled')
      assert.equal(c.ramPin,plain.ramPin)
    }
  }
  cases.push({path,sha256:createHash('sha256').update(raw).digest('hex'),wholeByteSwap,byte1Only,signals:49,status:'BIJECTIVE_MAP_WITH_ASSOCIATED_DQS_AND_DM_CHECKED'})
}
const report={status:'AM3352_ALLOWED_SWIZZLE_MAPS_PASS',source:'https://e2e.ti.com/support/processors-group/processors/f/processors-forum/1205797/am4376-about-ddr3-data-line-swapping',scope:'TI engineer AM335x-specific guidance; no signal-integrity or fabrication qualification',cases,fabricationReady:false}
writeFileSync('checks/integrated/am3352-swizzle-validation.json',JSON.stringify(report,null,2)+'\n')
console.log(report.status)
