import connections from "./memory-connections.json"
import {Fragment} from "react"

// TI SPRS717L Tables 7-68/7-69: 25mil intra-class/byte and 5mil
// differential skew. These are planar route constraints, not SI approval.
// 0.127mm pair gap remains a geometry trial until the 8-layer stackup is
// solved for the selected 50–75ohm Zo / 2*Zo differential impedance.
export const ddrGroups=[
  {name:"DDR_BYTE0",layer:"inner2" as const,signals:connections.filter(c=>
    /^DDR_D([0-7])$/.test(c.name)||/^DDR_DQM0$|^DDR_DQS[n]?0$/.test(c.name)).map(c=>c.name)},
  {name:"DDR_BYTE1",layer:"inner6" as const,signals:connections.filter(c=>
    /^DDR_D(8|9|1[0-5])$/.test(c.name)||/^DDR_DQM1$|^DDR_DQS[n]?1$/.test(c.name)).map(c=>c.name)},
  {name:"DDR_COMMAND_CLOCK",layer:"inner4" as const,signals:connections.filter(c=>
    /^DDR_(A\d|BA\d|CASn|RASn|WEn|CSn0|CKE|ODT|CKn?$)/.test(c.name)).map(c=>c.name)},
]
export const differentialPairs=[
  {name:"DDR_DQS0_PAIR",positiveConnection:"DDR_DQS0",negativeConnection:"DDR_DQSn0"},
  {name:"DDR_DQS1_PAIR",positiveConnection:"DDR_DQS1",negativeConnection:"DDR_DQSn1"},
  {name:"DDR_CK_PAIR",positiveConnection:"DDR_CK",negativeConnection:"DDR_CKn"},
]
const members=ddrGroups.flatMap(g=>g.signals)
if(ddrGroups[0].signals.length!==11||ddrGroups[1].signals.length!==11||ddrGroups[2].signals.length!==26||
  members.length!==48||new Set(members).size!==48||connections.some(c=>c.name!=="DDR_RESETn"&&!members.includes(c.name)))
  throw new Error("AM3352 DDR constraints must cover 48 synchronous signals and separate RESETn")

export const DdrConstraints=({pairGap=.127}:{pairGap?:number}={})=> <>
  <bus name="DDR_RESET" connections={["DDR_RESETn"]} pcbAllowedLayers={["inner4"]} pcbTraceWidth={.1016}/>
  {ddrGroups.map(g=><Fragment key={g.name}><bus name={g.name} connections={g.signals}
    pcbAllowedLayers={[g.layer]} pcbTraceWidth={.1016} maxLengthSkew={.635}/></Fragment>)}
  {differentialPairs.map(p=><Fragment key={p.name}><differentialpair {...p} maxLengthSkew={.127} pcbTraceGap={pairGap}/></Fragment>)}
</>
