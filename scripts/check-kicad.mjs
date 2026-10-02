import {existsSync, openSync, closeSync, readFileSync, writeFileSync, rmSync} from "node:fs"
import {createHash} from "node:crypto"
import {spawnSync} from "node:child_process"
import "./prepare-kicad.mjs"

const macCli = "/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli"
const cli = process.env.G350_KICAD_CLI ?? (existsSync(macCli) ? macCli : "kicad-cli")
const board = "dist/index/kicad/index.kicad_pcb"
rmSync("checks/kicad-board.sha256",{force:true})
const log = openSync("checks/kicad-drc.log","w")
const result = spawnSync(cli,["pcb","drc","--refill-zones","--save-board","--format","json",
  "--all-track-errors","--exit-code-violations","-o","checks/kicad-drc.json",board],
  {stdio:["ignore",log,log]})
closeSync(log)
if (result.error || ![0,5].includes(result.status))
  throw result.error ?? new Error(`KiCad DRC exited with ${result.status}`)
const report = JSON.parse(readFileSync("checks/kicad-drc.json","utf8"))
const warnings = report.violations.filter(e=>e.type === "lib_footprint_issues" &&
  e.severity === "warning" &&
  e.description === "The current configuration does not include the footprint library 'tscircuit'")
const issues = [...report.violations.filter(e=>!warnings.includes(e)),...report.unconnected_items]
if (issues.length) throw new Error(`KiCad found ${issues.length} geometry/connectivity issues; see checks/kicad-drc.json`)
writeFileSync("checks/kicad-board.sha256",createHash("sha256").update(readFileSync(board)).digest("hex")+"  index.kicad_pcb\n")
console.log(`KiCad: zero geometry/connectivity issues; ${warnings.length} external-library comparison warnings recorded.`)
