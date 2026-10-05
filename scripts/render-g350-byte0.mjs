import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {convertCircuitJsonToPcbSvg} from 'circuit-to-svg'
import {Resvg} from '@resvg/resvg-js'
const [input,root]=process.argv.slice(2)
if(!input||!root)throw new Error('Supply the frozen source and check directory')
const raw=readFileSync(input),circuit=JSON.parse(raw),outputs=[]
for(const layer of ['top','bottom']){
 const svg=convertCircuitJsonToPcbSvg(circuit,{layer,width:1000,height:1553,
  showCourtyards:false,shouldDrawRatsNest:false,showPcbNotes:false,
  showFabricationNotes:false,shouldDrawErrors:false})
 const stem=`${root}/g350-byte0-${layer}`
 writeFileSync(`${stem}.svg`,svg)
 writeFileSync(`${stem}.png`,new Resvg(svg,{font:{loadSystemFonts:true}}).render().asPng())
 outputs.push(`${stem}.svg`,`${stem}.png`)
}
const sha=b=>createHash('sha256').update(b).digest('hex')
writeFileSync(`${root}/render.json`,JSON.stringify({circuit:input,circuitSha256:sha(raw),
 scope:'Actual shaped 280-part board; only byte0 and package power escapes routed. Host opens and shell fit remain unfinished.',
 errorsAndRatsnestOmittedForCopperInspection:true,outputs:Object.fromEntries(outputs.map(p=>[p,sha(readFileSync(p))]))},null,2)+'\n')
console.log('Rendered both outer copper layers of the frozen byte0 source.')
