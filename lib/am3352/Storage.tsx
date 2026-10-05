import {Fragment} from "react"
import {DM3D_SF} from "../../imports/DM3D_SF"
import {TPS62162DSGR} from "../../imports/TPS62162DSGR"
import {TPS3808G33DBVR} from "../../imports/TPS3808G33DBVR"
import {XFL4020_222MEC} from "../../imports/XFL4020_222MEC"
import {CL31A226KAHNNNE} from "../../imports/CL31A226KAHNNNE"
import {CL05B104KO5NNNC} from "../../imports/CL05B104KO5NNNC"
import {CL05B103KB5NNNC} from "../../imports/CL05B103KB5NNNC"
import {A_0402WGF1002TCE} from "../../imports/A_0402WGF1002TCE"
import {A_0402WGF1003TCE} from "../../imports/A_0402WGF1003TCE"
import {A_0402WGF330JTCE} from "../../imports/A_0402WGF330JTCE"
import {HostPins,CpuSignal} from "./Boot"
import {sdPosition,sdCopperKeepouts} from "./StorageLayout"

// MMC0 and VDDSHV4 share PERIPH_3V3, so the powered card cannot drive
// an unpowered CPU I/O bank. TPS62162 is enabled by the final PMIC 3.3V
// rail; its fixed FB pin is grounded per SLVSAM2. Native power routing,
// switch-node layout, effective capacitance and full load budget remain.
export const Storage=()=> <>
  <TPS62162DSGR name="U_SD_REG" pcbX={28} pcbY={40} noConnect={["pin8"]} schX={65} schY={30}/>
  <HostPins name="U_SD_REG" width={.25} pins={{pin1:"GND",pin2:"VIO_BOOST5V",pin3:"IO_3V3",
    pin4:"GND",pin5:"GND",pin6:"PERIPH_3V3",pin7:"PERIPH_SW",pin9:"GND"}}/>
  <XFL4020_222MEC name="L_SD_REG" pcbX={32.5} pcbY={40} schX={70} schY={30}/>
  <HostPins name="L_SD_REG" width={.4} pins={{pin1:"PERIPH_SW",pin2:"PERIPH_3V3"}}/>
  <CL31A226KAHNNNE name="C_SD_REG_IN" pcbX={24} pcbY={40} pcbRotation={90} schX={65} schY={25}/>
  <HostPins name="C_SD_REG_IN" pins={{pin1:"VIO_BOOST5V",pin2:"GND"}}/>
  <CL05B104KO5NNNC name="C_SD_REG_HF" pcbX={26.9} pcbY={42.3} schX={60} schY={25}/>
  <HostPins name="C_SD_REG_HF" pins={{pin1:"VIO_BOOST5V",pin2:"GND"}}/>
  <CL31A226KAHNNNE name="C_SD_REG_OUT" pcbX={38} pcbY={40} schX={75} schY={25}/>
  <HostPins name="C_SD_REG_OUT" pins={{pin1:"PERIPH_3V3",pin2:"GND"}}/>
  {/* TPS65217 PGOOD is push-pull: it drives MR, never a wired-AND node.
      SBVS050N: CT open gives 20ms typical (12–28ms) after SENSE and MR
      are both valid. RESET pulls up to the CPU's 1.8V reset domain. */}
  <TPS3808G33DBVR name="U_POR" pcbX={16} pcbY={38} noConnect={["pin4"]} schX={55} schY={30}/>
  <HostPins name="U_POR" pins={{pin1:"CPU_PORn",pin2:"GND",pin3:"PMIC_MAIN_PGOOD",
    pin5:"PERIPH_3V3",pin6:"VDDS_1V8"}}/>
  <A_0402WGF1003TCE name="R_CPU_POR" pcbX={20} pcbY={36} schX={50} schY={30}/>
  <HostPins name="R_CPU_POR" pins={{pin1:"VDDS_1V8",pin2:"CPU_PORn"}}/>
  <CL05B104KO5NNNC name="C_POR_BYPASS" pcbX={12} pcbY={38} schX={55} schY={25}/>
  <HostPins name="C_POR_BYPASS" pins={{pin1:"VDDS_1V8",pin2:"GND"}}/>
  <CL05B103KB5NNNC name="C_POR_SENSE" pcbX={12} pcbY={40} schX={50} schY={25}/>
  <HostPins name="C_POR_SENSE" pins={{pin1:"PERIPH_3V3",pin2:"GND"}}/>
  {/* Card enters the footprint's negative-Y edge; +90deg points that
      opening toward the board's right edge. Hirose catalogue page9. */}
  <DM3D_SF name="J_SD" pcbX={sdPosition.x} pcbY={sdPosition.y} pcbRotation={sdPosition.rotation} schX={80} schY={0}/>
  {sdCopperKeepouts.map(k=><Fragment key={k.name}><keepout shape="rect"
    pcbX={k.x} pcbY={k.y} width={k.width} height={k.height} layers={["top"]} excludeRefs={[".J_SD"]}/></Fragment>)}
  <HostPins name="J_SD" pins={{pin1:"SD_DAT2",pin2:"SD_DAT3",pin3:"SD_CMD",pin4:"PERIPH_3V3",
    pin5:"SD_CLK_CARD",pin6:"GND",pin7:"SD_DAT0",pin8:"SD_DAT1",pin9:"SD_CD",pin10:"GND",
    pin11:"GND",pin12:"GND",pin13:"GND",pin14:"GND"}}/>
  {['DAT0','DAT1','DAT2','DAT3','CMD'].map((s,i)=><Fragment key={s}>
    <CpuSignal fn={`MMC0_${s}`} net={`SD_${s}`}/>
    <A_0402WGF1002TCE name={`R_SD_${s}`} pcbX={31} pcbY={2+i*2} layer="bottom" schX={75} schY={-10-i*4}/>
    <HostPins name={`R_SD_${s}`} pins={{pin1:"PERIPH_3V3",pin2:`SD_${s}`}}/>
  </Fragment>)}
  <CpuSignal fn="MMC0_CLK" net="SD_CLK_CPU"/>
  <A_0402WGF330JTCE name="R_SD_CLK" pcbX={-2} pcbY={9.4} pcbRotation={90} schX={75} schY={-35}/>
  <HostPins name="R_SD_CLK" pins={{pin1:"SD_CLK_CPU",pin2:"SD_CLK_CARD"}}/>
  {/* C18 / GPIO0_7, mode7. MMC0_CLK must enable RXACTIVE in pinmux. */}
  <CpuSignal fn="ECAP0_IN_PWM0_OUT" net="SD_CD"/>
  <A_0402WGF1002TCE name="R_SD_CD" pcbX={31} pcbY={12} layer="bottom" schX={85} schY={-10}/>
  <HostPins name="R_SD_CD" pins={{pin1:"IO_3V3",pin2:"SD_CD"}}/>
  <CL05B104KO5NNNC name="C_SD_SOCKET_HF" pcbX={46} pcbY={17.7} layer="bottom" schX={85} schY={5}/>
  <HostPins name="C_SD_SOCKET_HF" pins={{pin1:"PERIPH_3V3",pin2:"GND"}}/>
  <CL31A226KAHNNNE name="C_SD_SOCKET_BULK" pcbX={43} pcbY={20} layer="bottom" schX={90} schY={5}/>
  <HostPins name="C_SD_SOCKET_BULK" pins={{pin1:"PERIPH_3V3",pin2:"GND"}}/>
</>
