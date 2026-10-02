import connections from "./memory-connections.json"

// Timing groups follow the documented DDR workflow. These constraints are
// conservative trial values, not approved RK3566 electrical timing budgets.
// Package delays, via depth and impedance must be qualified independently.
type DdrBootstrapGroup={name:string;layer:"inner1"|"inner3"|"inner5"|"inner6";signals:string[];trialMaxLengthSkew?:number}
const signalLayers=["inner1","inner3","inner5","inner6"] as const
export const ddrBootstrapGroups:DdrBootstrapGroup[] = [
  ...(["A","B"] as const).flatMap(channel=>[0,1].map((byte):DdrBootstrapGroup=>({
    name:`DDR_${channel}_BYTE${byte}`,
    layer:signalLayers[(channel==="A"?0:2)+byte],
    signals:connections.filter(c=>{
      if(!c.name.endsWith(`_${channel}`))return false
      const dq=/LPDDR4_DQ(\d+)_/.exec(c.name)
      return dq ? Math.floor(Number(dq[1])/8)===byte : new RegExp(`LPDDR4_(DM${byte}|DQS${byte}[PN])_`).test(c.name)
    }).map(c=>c.name),
    trialMaxLengthSkew:.5,
  }))),
  ...(["A","B"] as const).map((channel):DdrBootstrapGroup=>({
    name:`DDR_${channel}_COMMAND`,layer:channel==="A"?"inner1":"inner3",
    signals:connections.filter(c=>c.name.endsWith(`_${channel}`)&&/^LPDDR4_(A\d|CKE|CS|ODT)/.test(c.name)).map(c=>c.name),
    trialMaxLengthSkew:.5,
  })),
  ...(["A","B"] as const).map((channel):DdrBootstrapGroup=>({
    name:`DDR_${channel}_CLOCK`,layer:channel==="A"?"inner5":"inner6",
    signals:connections.filter(c=>/^LPDDR4_CLK[PN]_/.test(c.name)&&c.name.endsWith(`_${channel}`)).map(c=>c.name),
    trialMaxLengthSkew:.1,
  })),
  {name:"DDR_RESET",layer:"inner1",signals:["LPDDR4_RESETn"],trialMaxLengthSkew:undefined},
]
const members=ddrBootstrapGroups.flatMap(g=>g.signals)
if(members.length!==67||new Set(members).size!==67||connections.some(c=>!members.includes(c.name)))
  throw new Error("DDR groups must cover all 67 actual connections exactly once")
export const ddrBootstrapPairs=(["A","B"] as const).flatMap(channel=>["DQS0","DQS1","CLK"].map(stem=>({
  name:`DDR_${channel}_${stem}_PAIR`,
  positiveConnection:`LPDDR4_${stem}P_${channel}`,
  negativeConnection:`LPDDR4_${stem}N_${channel}`,
})))
