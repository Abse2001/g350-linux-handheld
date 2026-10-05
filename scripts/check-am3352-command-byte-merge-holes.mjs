import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const paths=[process.argv[2]??'routing/am3352-command-unmatched-pruned-paths.json',
 process.argv[3]??'routing/am3352-guided-both-bytes-and-reset-paths.json']
const reportPath=process.argv[4]??'checks/integrated/am3352-command-byte-merge-hole-diagnostic.json'
const vias=paths.map(path=>Object.entries(JSON.parse(readFileSync(path))).flatMap(([name,route])=>
 route.filter(p=>p.via).map(p=>({name,...p}))))
const conflicts=[];let minimum=Infinity
for(const a of vias[0])for(const b of vias[1]){
 const centre=Math.hypot(a.x-b.x,a.y-b.y),hole=centre-.254,copper=centre-.4572
 minimum=Math.min(minimum,hole)
 if(hole<.254-1e-6||copper<.1016-1e-6)conflicts.push({command:a.name,byte:b.name,
  commandVia:{x:a.x,y:a.y},byteVia:{x:b.x,y:b.y},holeEdgeClearanceMm:hole,copperEdgeClearanceMm:copper})
}
const report={status:conflicts.length?'COMMAND_BYTE_MERGE_HAS_HOLE_OR_VIA_COPPER_CONFLICTS':'COMMAND_BYTE_MERGE_HOLE_SCREEN_CLEAR',
 inputs:paths.map(path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})),
 commandVias:vias[0].length,byteVias:vias[1].length,minimumCrossHoleEdgeClearanceMm:minimum,
 conflicts,accepted:false,fabricationReady:false,
 scope:'Cross-candidate via/hole screen only. Traces, pads, full independent DRC, timing and original-shell integration are outside this diagnostic.'}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,conflicts:conflicts.length,minimumCrossHoleEdgeClearanceMm:minimum}))
if(conflicts.length)process.exitCode=1
