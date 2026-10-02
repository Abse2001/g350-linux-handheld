import {existsSync, openSync, closeSync, readFileSync, writeFileSync, rmSync} from "node:fs"
import {createHash} from "node:crypto"
import {spawnSync} from "node:child_process"
import "./prepare-kicad.mjs"

const macCli = "/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli"
const cli = process.env.G350_KICAD_CLI ?? (existsSync(macCli) ? macCli : "kicad-cli")
const board = "dist/index/kicad/index.kicad_pcb"
rmSync("checks/kicad-board.sha256",{force:true})
rmSync("checks/kicad-drc.json",{force:true})
function runDrc(name){
  const log=openSync(`checks/${name}.log`,"w")
  const result=spawnSync(cli,["pcb","drc","--refill-zones","--save-board","--format","json",
    "--all-track-errors","--exit-code-violations","-o",`checks/${name}.json`,board],
    {stdio:["ignore",log,log]})
  closeSync(log)
  if(result.error||![0,5].includes(result.status))
    throw result.error??new Error(`KiCad DRC exited with ${result.status}`)
  return result
}
// First let KiCad normalize the converter's board format. The second pass
// qualifies the board against its complete local library with no exceptions.
runDrc("kicad-normalization")
const macPython="/Applications/KiCad/KiCad.app/Contents/Frameworks/Python.framework/Versions/3.9/bin/python3.9"
const python=process.env.G350_KICAD_PYTHON??(existsSync(macPython)?macPython:"python3")
const libraryLog=openSync("checks/kicad-library.log","w")
const library=spawnSync(python,["scripts/prepare-kicad-library.py",board],
  {stdio:["ignore",libraryLog,libraryLog]})
closeSync(libraryLog)
if(library.error||library.status!==0)
  throw library.error??new Error(`KiCad footprint library export exited with ${library.status}`)
const result=runDrc("kicad-drc")
const report = JSON.parse(readFileSync("checks/kicad-drc.json","utf8"))
const issues = [...report.violations,...report.unconnected_items]
if (result.status!==0||issues.length) throw new Error(`KiCad found ${issues.length} DRC/connectivity issues; see checks/kicad-drc.json`)
writeFileSync("checks/kicad-board.sha256",createHash("sha256").update(readFileSync(board)).digest("hex")+"  index.kicad_pcb\n")
console.log("KiCad: zero DRC violations, zero warnings and zero unconnected items; local footprint library included.")
