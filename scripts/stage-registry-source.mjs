import {execFileSync} from "node:child_process"
import {cpSync,mkdirSync,readFileSync,writeFileSync} from "node:fs"
import {resolve,dirname,relative} from "node:path"

// tsci push 0.1.2227 does not consult .gitignore. Publish only a reviewed,
// tracked source allowlist, never local reference PDFs or historical Gerbers.
const root=process.cwd()
const destination=resolve(process.argv[2]??"tmp/registry-source")
if(!destination.startsWith(resolve(root,"tmp")+"/"))throw new Error("Use a staging directory inside tmp/")
const required=new Set(["LICENSE","README.md","index.circuit.tsx","rev-b.circuit.tsx",
  "package.json","package-lock.json","bun.lock","tsconfig.json","design-status.json",
  "fabrication/STATUS.md","checks/integrated/memory-36-check-summary.json",
  "checks/integrated/memory-43-check-summary.json","checks/integrated/memory-43-connectivity.json",
  "checks/integrated/memory-43-diagnostic-export.json","checks/integrated/memory-43-phase-validation.json",
  "checks/integrated/memory-43-kicad-drc.json","checks/integrated/memory-43-shorts.log",
  "checks/integrated/memory-36-diagnostic-export.json","checks/integrated/memory-36-kicad-drc.json",
  "checks/integrated/memory-36-shorts.log","checks/integrated/phase-via-validation.json",
  "checks/integrated/import-validation.json","checks/integrated/manual-escape-clearance.json",
  "checks/integrated/am3352-import-validation.json","checks/integrated/am3352-swizzle-validation.json",
  "checks/integrated/am3352-clearance-11-check-summary.json","checks/integrated/am3352-clearance-11-connectivity.json",
  "checks/integrated/am3352-clearance-11-diagnostic-export.json","checks/integrated/am3352-clearance-11-kicad-drc.json",
  "checks/integrated/am3352-clearance-11-shorts.log","checks/integrated/am3352-11-check-summary.json",
  "checks/integrated/hdi-38-check-summary.json","checks/integrated/thin-hdi-34-check-summary.json"])
const directories=["imports/","lib/","experiments/","routing/","scripts/","software/","docs/","images/"]
const tracked=execFileSync("git",["ls-files","-z"],{encoding:"utf8"}).split("\0").filter(Boolean)
const paths=tracked.filter(p=>required.has(p)||directories.some(d=>p.startsWith(d)))
if(paths.some(p=>p.startsWith("reference/")||p.startsWith("tmp/")||/\.(zip|pdf)$/i.test(p)))
  throw new Error("Reference documents and manufacturing archives are not registry source")
mkdirSync(destination,{recursive:true})
for(const p of paths) {
  const target=resolve(destination,p)
  mkdirSync(dirname(target),{recursive:true})
  cpSync(resolve(root,p),target)
}
const pkg=JSON.parse(readFileSync(resolve(destination,"package.json"),"utf8"))
writeFileSync(resolve(destination,"registry-source-manifest.json"),JSON.stringify({
  version:pkg.version,scope:"Experimental source and selected verification evidence; no manufacturing release",
  fabricationReady:false,files:paths},null,2)+"\n")
console.log(`Staged ${paths.length} tracked source files at ${relative(root,destination)} (${pkg.version})`)
