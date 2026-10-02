import {existsSync,readFileSync,readdirSync,writeFileSync} from "node:fs"
import {createHash} from "node:crypto"
import {gunzipSync} from "node:zlib"

const directory="fabrication/kicad/3dmodels/tscircuit_builtin.3dshapes"
const hashes=new Map(readFileSync("fabrication/SHA256SUMS","utf8").trim().split("\n")
  .map(line=>{const [hash,path]=line.split("  ");return [path,hash]}))
let restored=0
for(const file of readdirSync(directory).filter(file=>file.endsWith(".step.gz"))){
  const destination=`${directory}/${file.slice(0,-3)}`
  const expected=hashes.get(destination.replace(/^fabrication\//,""))
  const bytes=gunzipSync(readFileSync(`${directory}/${file}`))
  const hash=buffer=>createHash("sha256").update(buffer).digest("hex")
  if(!expected||hash(bytes)!==expected) throw new Error(`Model checksum mismatch: ${file}`)
  if(existsSync(destination)){
    if(hash(readFileSync(destination))!==expected) throw new Error(`Existing model differs: ${destination}`)
    continue
  }
  writeFileSync(destination,bytes)
  restored++
}
console.log(`Restored ${restored} STEP models; every decompressed model matches its release checksum.`)
