import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {convertCircuitJsonToPcbSvg} from 'circuit-to-svg'
import {Resvg} from '@resvg/resvg-js'

const path='dist/experiments/am3352-g350-critical-placement/circuit.json'
const raw=readFileSync(path),d=JSON.parse(raw)
const outputs=[]
for(const layer of ['top','bottom']){
  const svg=convertCircuitJsonToPcbSvg(d,{layer,width:1000,height:1553,
    showCourtyards:true,shouldDrawRatsNest:false,showPcbNotes:true,
    showFabricationNotes:false,shouldDrawErrors:true})
  const stem=`checks/layout/critical-variant/g350-critical-placement-${layer}`
  writeFileSync(`${stem}.svg`,svg)
  writeFileSync(`${stem}.png`,new Resvg(svg,{font:{loadSystemFonts:true}}).render().asPng())
  outputs.push(`${stem}.svg`,`${stem}.png`)
}
const sha=b=>createHash('sha256').update(b).digest('hex')
writeFileSync('checks/layout/critical-variant/g350-critical-placement-render.json',JSON.stringify({
  circuit:path,circuitSha256:sha(raw),scope:'Unrouted placement; exact enclosure fit unverified',
  outputs:Object.fromEntries(outputs.map(p=>[p,sha(readFileSync(p))]))
},null,2)+'\n')
console.log('Rendered both sides of the current placement study.')
