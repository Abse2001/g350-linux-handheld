import {existsSync, mkdirSync, openSync, closeSync, cpSync, readdirSync, readFileSync, writeFileSync, rmSync} from "node:fs"
import {createHash} from "node:crypto"
import {spawnSync} from "node:child_process"
// This module checks the completed route, shorts, DRC and source freshness
// before writing any ordering files, including supplier assembly rotations.
await import("./fabrication.mjs")

const macCli = "/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli"
const cli = process.env.G350_KICAD_CLI ?? (existsSync(macCli) ? macCli : "kicad-cli")
const board = "dist/index/kicad/index.kicad_pcb"
const output = "fabrication/gerbers"
rmSync(output,{recursive:true,force:true})
rmSync("fabrication/g350-rev-a-gerbers.zip",{force:true})
mkdirSync(output,{recursive:true})
const log = openSync("checks/fabrication-export.log","w")
function run(command,args) {
  const result = spawnSync(command,args,{stdio:["ignore",log,log]})
  if (result.error || result.status !== 0) throw result.error ?? new Error(`${command} exited with ${result.status}`)
}
try {
  // Plot exactly the independently checked, saved and refilled KiCad board.
  run(cli,["pcb","export","gerbers","--layers","F.Cu,In1.Cu,In2.Cu,B.Cu,F.Mask,B.Mask,F.SilkS,B.SilkS,F.Paste,B.Paste,Edge.Cuts",
    "--use-drill-file-origin","--subtract-soldermask","--output",`${output}/`,board])
  run(cli,["pcb","export","drill","--format","excellon","--drill-origin","plot",
    "--excellon-units","mm","--excellon-separate-th","--output",`${output}/`,board])
  run("zip",["-j","fabrication/g350-rev-a-gerbers.zip",...readdirSync(output).map(f=>`${output}/${f}`)])
} finally { closeSync(log) }
await import("./verify-gerber-coordinates.mjs")
cpSync("dist/index/kicad","fabrication/kicad",{recursive:true,
  filter:path=>!path.endsWith(".kicad_prl")})
const files = ["circuit.json","bom-jlcpcb.csv","pnp-jlcpcb.csv","g350-rev-a-gerbers.zip",
  ...readdirSync("fabrication/kicad",{recursive:true,withFileTypes:true}).filter(e=>e.isFile())
    .map(e=>`${e.parentPath.replace(/^fabrication\//,"")}/${e.name}`)]
writeFileSync("fabrication/SHA256SUMS",files.map(f=>
  createHash("sha256").update(readFileSync(`fabrication/${f}`)).digest("hex")+`  ${f}`).join("\n")+"\n")
console.log("Exported the checked four-layer Gerbers, drills, KiCad project and supplier assembly files.")
