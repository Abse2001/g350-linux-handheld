import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const sourcePath='lib/integrated/rk3566-ball-map.json',ramPath='lib/integrated/hynix-ball-map.json'
const raw=readFileSync(sourcePath),map=JSON.parse(raw),ram=JSON.parse(readFileSync(ramPath))
const groups=new Map()
for(const [ball,{functions,page}]of Object.entries(map)){
 const original=functions[0],ground=/^(VSS|AVSS|TVSS|DDR_AVSS|PMUPLL_AVSS)/.test(original)
 if(!ground&&!/VDD|VCC|^PMUIO/.test(original))continue
 const name=ground?'GND':original.replace(/_\d+$/,'')
 if(!groups.has(name))groups.set(name,{domain:name,kind:ground?'ground':'supply',balls:[],assignmentStatus:'UNWIRED'})
 groups.get(name).balls.push({ball,function:original,datasheetPage:page})
}
for(const g of groups.values()){
 if(g.kind==='ground'){g.requiredVoltage=0;continue}
 if(/_0V9$/.test(g.domain))g.requiredVoltage=.9
 else if(/_1V8$/.test(g.domain)||g.domain==='OTP_VCC18')g.requiredVoltage=1.8
 else if(/_3V3$/.test(g.domain)||g.domain==='PMUIO1')g.requiredVoltage=3.3
 else if(/^DDRPHY_VDDQ/.test(g.domain)){g.requiredVoltage=1.1;g.voltageEvidence='RK3566 hardware guide Figure 2-25, LPDDR4 supply, p39'}
 else if(g.domain==='PMUIO2'||/^VCCIO\d$/.test(g.domain)){g.allowedVoltages=[1.8,3.3];g.selectionStatus='Pending complete IO allocation and matching boot/software configuration'}
 else if(/^VDD_(CPU|GPU|NPU|LOGIC)$/.test(g.domain)){g.voltageKind='DYNAMIC';g.selectionStatus='Pending regulator, DVFS and load/sequence qualification'}
 else throw new Error('Power domain has no voltage requirement classification: '+g.domain)
}
const ramDomains=['VDD1','VDD2','VDDQ','VSS','VSSQ'].map(domain=>({domain,requiredVoltage:domain==='VDD1'?1.8:domain.startsWith('VDD')?1.1:0,balls:Object.entries(ram).filter(([ball,f])=>f===domain).map(([ball])=>ball),assignmentStatus:'UNWIRED'})).filter(g=>g.balls.length)
const seen=new Set();for(const g of groups.values())for(const b of g.balls){if(seen.has(b.ball))throw new Error('Duplicate supply/ground ball');seen.add(b.ball)}
const report={status:'PIN_INVENTORY_ONLY_HOST_UNPOWERED',fabricationReady:false,scope:'Every documented processor supply/ground ball plus RAM supply/ground balls. No physical power wiring, regulator choice or decoupling qualification is implied.',processorSource:{path:sourcePath,sha256:createHash('sha256').update(raw).digest('hex'),url:'https://wiki.friendlyelec.com/wiki/images/8/89/Rockchip_RK3566_Datasheet_V1.2-20220930.pdf'},hardwareGuide:'https://dl.xkwy2018.com/downloads/RK3568/RK356X/Hardware/Rockchip_RK3566_Hardware_Design_Guide_V1.1_EN.pdf',socPowerAndGroundBalls:seen.size,socDomains:[...groups.values()],ramDomains,pmicInternalFilterPinsDoNotDriveExternally:{VCC_1P8A:44,VCC_1P8D:48,VCC_RTC:45},requiredSequence:['0.9V PMU/analog/logic','1.8V PMU/general and early 3.3V PMU/GPU','CPU','DDR','remaining 3.3V','reset release at least 10ms after last stable rail'],unresolvedPowerPath:'RK817 SYS follows the battery without USB input. A 3.3V step-down regulator cannot maintain 3.3V when SYS falls below it. A qualified buck-boost/boost-fed power architecture and USB current-limit policy remain required.'}
writeFileSync('lib/integrated/host-power-inventory.json',JSON.stringify(report,null,2)+'\n')
console.log(`Inventoried ${seen.size} processor supply/ground balls in ${groups.size} groups and ${ramDomains.reduce((s,g)=>s+g.balls.length,0)} RAM supply/ground balls; all remain UNWIRED.`)
