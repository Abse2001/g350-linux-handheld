import {existsSync,readFileSync,readdirSync,writeFileSync} from "node:fs"
import {createHash} from "node:crypto"
import {gunzipSync} from "node:zlib"

const directory="fabrication/kicad/3dmodels"
const hashes=new Map(readFileSync("fabrication/SHA256SUMS","utf8").trim().split("\n")
  .map(line=>{const [hash,path]=line.split("  ");return [path,hash]}))
let restored=0
const compressed=[directory,"imports"].flatMap(root=>
  readdirSync(root,{recursive:true,withFileTypes:true})
    .filter(e=>e.isFile()&&e.name.endsWith(".step.gz"))
    .map(e=>`${e.parentPath}/${e.name}`))
for(const file of compressed){
  const destination=file.slice(0,-3)
  const expected=destination.startsWith("fabrication/")
    ? hashes.get(destination.replace(/^fabrication\//,""))
    : readFileSync(`${destination}.sha256`,"utf8").trim().split(/\s+/)[0]
  const bytes=gunzipSync(readFileSync(file))
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
