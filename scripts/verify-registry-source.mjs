import {readFileSync,writeFileSync} from "node:fs"
import {createHash} from "node:crypto"
import {join,resolve} from "node:path"

// Read-only verification of a public experimental source publication.
// No session tokens are needed or read. Check all stored files, not merely
// a successful CLI message or the registry's build status.
const staging=resolve(process.argv[2]??"tmp/registry-source-1.2.2")
const versionTag=process.argv[3]??"integrated-experimental"
const pkg=JSON.parse(readFileSync(join(staging,"package.json"),"utf8"))
const manifest=JSON.parse(readFileSync(join(staging,"registry-source-manifest.json"),"utf8"))
const match=/^@tsci\/([^\.]+)\.(.+)$/.exec(pkg.name)
if(!match)throw new Error("Expected a scoped tsci package")
const name=`${match[1]}/${match[2]}@${pkg.version}-${versionTag}`
const base="https://registry-api.tscircuit.com"
const u=new URL(base+"/package_files/list");u.searchParams.set("package_name_with_version",name)
const response=await fetch(u);if(!response.ok)throw new Error(`List: HTTP ${response.status}`)
const listing=await response.json()
const expected=new Set([...manifest.files,"registry-source-manifest.json"])
if(listing.package_files.length!==expected.size||listing.package_files.some(f=>!expected.has(f.file_path)))
  throw new Error("Remote source allowlist differs from staging")
const files=[];let next=0
const hash=b=>createHash("sha256").update(b).digest("hex")
await Promise.all(Array.from({length:6},async()=>{
  while(next<listing.package_files.length) {
    const f=listing.package_files[next++]
    const u=new URL(base+"/package_files/download");u.searchParams.set("package_file_id",f.package_file_id)
    const r=await fetch(u,{signal:AbortSignal.timeout(30000)})
    if(!r.ok)throw new Error(`Download ${f.file_path}: HTTP ${r.status}`)
    const downloaded=Buffer.from(await r.arrayBuffer()),local=readFileSync(join(staging,f.file_path))
    if(hash(downloaded)!==hash(local))throw new Error(`Remote content differs: ${f.file_path}`)
    files.push({file:f.file_path,sha256:hash(local)})
  }
}))
const get=await fetch(base+"/package_releases/get",{method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({package_name_with_version:name})})
if(!get.ok)throw new Error(`Release: HTTP ${get.status}`)
const release=(await get.json()).package_release
if(!release||release.is_latest!==false)throw new Error("Expected an explicitly non-latest experimental release")
const report={status:"EXPERIMENTAL_SOURCE_PUBLISHED",fabricationReady:false,name,
  releaseId:release.package_release_id,isLatest:release.is_latest,files:files.sort((a,b)=>a.file.localeCompare(b.file))}
writeFileSync(`checks/integrated/registry-publication-${pkg.version}.json`,JSON.stringify(report,null,2)+"\n")
console.log(`Verified ${name}: ${files.length} exact source files, experimental release, not fabrication-ready`)
