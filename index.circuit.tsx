import { Connections } from "./lib/Connections"
import { routePowerAroundEarlierCopper, routeSignalsAroundEarlierCopper } from "./lib/PhasedAutorouter"
import { Fragment } from "react"
import { MCP23017_E_SO } from "./imports/MCP23017_E_SO"
import { TS_1187A_B_A_B } from "./imports/TS_1187A_B_A_B"
import { PiZero2W } from "./lib/PiZero2W"
import { Power } from "./lib/Power"
import { Audio } from "./lib/Audio"
import { Display } from "./lib/Display"

// All coordinates are mm. Front controls are top; support electronics are rear.
const buttons = [
  {name:"SW_UP",    x:-24,y:-19,port:"GPA0",label:"UP"},
  {name:"SW_DOWN",  x:-24,y:-39,port:"GPA1",label:"DOWN"},
  {name:"SW_LEFT",  x:-34,y:-29,port:"GPA2",label:"LEFT"},
  {name:"SW_RIGHT", x:-14,y:-29,port:"GPA3",label:"RIGHT"},
  {name:"SW_A",     x: 34,y:-29,port:"GPA4",label:"A"},
  {name:"SW_B",     x: 24,y:-39,port:"GPA5",label:"B"},
  {name:"SW_X",     x: 24,y:-19,port:"GPA6",label:"X"},
  {name:"SW_Y",     x: 14,y:-29,port:"GPB3",label:"Y"},
  {name:"SW_SELECT",x:-12,y:-52,port:"GPB0",label:"SELECT"},
  {name:"SW_START", x: 12,y:-52,port:"GPB1",label:"START"},
  {name:"SW_MENU",  x:  0,y:-42,port:"GPB2",label:"MENU"},
] as const

const passivePart = (part:string) => ({jlcpcb:[part]})
const Wire = ({from,net,width=0.2,phase=0}:{from:string,net:string,width?:number,phase?:number}) =>
  <trace from={from} to={`net.${net}`} thickness={width} routingPhaseIndex={phase} />

export default () => (
  <board title="G350 Linux Handheld — Pi Zero 2 W Carrier Rev A"
    width={100} height={124} thickness={1.6} layers={4} borderRadius={3}
    material="fr4" fabricatorPreset="jlcpcb_standard" solderMaskColor="green"
    minTraceWidth={0.15} nominalTraceWidth={0.2}
    minTraceToPadEdgeClearance={0.2} minPadEdgeToPadEdgeClearance={0.2}
    minBoardEdgeClearance={0.5} minTraceToHoleEdgeClearance={0.5}
    minViaHoleDiameter={0.3} minViaPadDiameter={0.65}
    allowBlindAndBuriedVias={false} isViaInPadAllowed={false} defaultViaTenting
    autorouter="auto_local" autorouterVersion="latest" autorouterEffortLevel="2x"
    pcbStyle={{viaHoleDiameter:0.3,viaPadDiameter:0.65,silkscreenFontSize:1,silkscreenTextVisibility:"hidden"}}
  >
    <schematicsection name="host" displayName="Linux host — physical Pi J8 pins" />
    <schematicsection name="display" displayName="ST7796S display — 18-pin FPC" />
    <schematicsection name="audio" displayName="I2S audio" />
    <schematicsection name="controls" displayName="Front controls — MCP23017 address 0x20" />
    <schematicsection name="power" displayName="USB-C charger and 5V boost" />
    <schematicsection name="battery" displayName="MAX17048 fuel gauge" />

    <schematicsection name="decoupling" displayName="Rail bypass capacitors" />

    <autoroutingphase name="CONTROLS" phaseIndex={0} algorithmFn={routeSignalsAroundEarlierCopper}/>
    <autoroutingphase name="POWER" phaseIndex={1} algorithmFn={routePowerAroundEarlierCopper}/>
    <autoroutingphase name="DISPLAY_AUDIO" phaseIndex={2} algorithmFn={routeSignalsAroundEarlierCopper}/>
    <net name="GND" isGroundNet nominalTraceWidth={0.5} routingPhaseIndex={1}/>
    <net name="V3V3" isPowerNet routingPhaseIndex={1}/>
    <net name="V5V" isPowerNet routingPhaseIndex={1}/>
    <net name="USB_5V" isPowerNet routingPhaseIndex={1}/>
    {["I2S_DIN","I2S_BCLK","I2S_LRCLK","AMP_ENABLE","LCD_RESET","LCD_DC","LCD_BL",
      "SPI_MOSI","SPI_MISO","SPI_SCLK","LCD_CS","TOUCH_IRQ"].map(n=><Fragment key={n}>
      <net name={n} routingPhaseIndex={2}/></Fragment>)}
    {["SDA","SCL","CHARGING_N","BAT_ALERT_N","USB_GOOD_N"].map(n=><Fragment key={n}>
      <net name={n} routingPhaseIndex={0}/></Fragment>)}

    <PiZero2W />
    <Audio />
    <Power />
    <Display />

    {/* Keep the host-to-gauge clock branch on the outer copper, with no via cluster. */}
    <trace from="U_GAUGE.SCL" to="J_PI.pin5" thickness={0.2} routingPhaseIndex={0}
      pcbPathRelativeTo="U_GAUGE.SCL"
      pcbPath={["U_GAUGE.SCL",{x:-0.249936,y:2.5},{x:-2.18,y:2.5},
        {x:-7.68,y:8},{x:-11.68,y:8},{x:-11.68,y:16.9},"J_PI.pin5"]}/>
    <trace from="U_GAUGE.SDA" to="U_KEYS.SDA" thickness={0.2} routingPhaseIndex={0}
      pcbPathRelativeTo="U_GAUGE.SDA" pcbPath={["U_GAUGE.SDA",{x:-1.85,y:1.5},
        {x:-1.85,y:1.5,via:true,toLayer:"bottom"},{x:-1.85,y:1.5},
        {x:3,y:-3.35},{x:3,y:-10},{x:-7,y:-20},{x:-15,y:-28},
        {x:-24,y:-37},{x:-38.985,y:-36},"U_KEYS.SDA"]}/>

    <MCP23017_E_SO name="U_KEYS" pcbX={0} pcbY={-8} layer="bottom"
      schX={-12} schY={-8} schWidth={2.245} schHeight={3} schSectionName="controls"
    />
    {["VSS","A0","A1","A2"].map(p=><Wire key={p} from={`U_KEYS.${p}`} net="GND" width={0.4} phase={1}/>)}
    <Wire from="U_KEYS.SDA" net="SDA" />
    <Wire from="U_KEYS.SCL" net="SCL" />
    <Fragment><resistor name="R_RESET" schRotation={90} resistance="10k" footprint="0603" supplierPartNumbers={passivePart("C25804")}
      pcbX={6} pcbY={1} layer="bottom" schX={-5} schY={0} schSectionName="controls"
       /><Connections name="R_RESET" connections={{pin2:"net.V3V3"}}/></Fragment>
    <trace from="R_RESET.pin1" to="U_KEYS.N_RESET" thickness={0.2} routingPhaseIndex={2}
      pcbPathRelativeTo="R_RESET.pin1"
      pcbPath={["R_RESET.pin1",{x:0.825,y:-1.8},{x:-10.445,y:-1.8},"U_KEYS.N_RESET"]}/>
    <Fragment><capacitor name="C_KEYS" schRotation={-90} capacitance="100nF" footprint="0603" supplierPartNumbers={passivePart("C14663")}
      pcbX={-2.73} pcbY={-15.5} layer="bottom" maxDecouplingTraceLength={2.5}
      schX={-20} schY={-8} schSectionName="controls"
       /><trace from="C_KEYS.pin1" to="C_KEYS_BULK.pin1" thickness={0.2}
         routingPhaseIndex={1} maxLength={25} pcbPath={["C_KEYS.pin1","C_KEYS_BULK.pin1"]}/></Fragment>
    <trace from="U_KEYS.VDD" to="C_KEYS.pin1" thickness={0.2} routingPhaseIndex={1}
      pcbPath={["U_KEYS.VDD","C_KEYS.pin1"]}/>
    <trace from="C_KEYS.pin2" to="KEYS_BYPASS_GND.bottom" thickness={0.2} routingPhaseIndex={1}
      pcbPath={["C_KEYS.pin2","KEYS_BYPASS_GND.bottom"]}/>
    <via name="KEYS_BYPASS_GND" pcbX={-4.7} pcbY={-15.5} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="bottom" toLayer="top" connectsTo="net.GND"/>
    <Fragment><capacitor name="C_KEYS_BULK" schRotation={-90} capacitance="10uF" footprint="0805" supplierPartNumbers={passivePart("C15850")}
      pcbX={7} pcbY={-17} pcbRotation={180} layer="bottom" schX={-20} schY={-12} schSectionName="controls"
       /><Connections name="C_KEYS_BULK" connections={{pin1:"net.V3V3",pin2:"net.GND"}}/></Fragment>
    <via name="KEYS_BULK_GND" pcbX={9.5} pcbY={-16} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="bottom" toLayer="top" connectsTo="net.GND"/>
    <trace from="C_KEYS_BULK.pin2" to="KEYS_BULK_GND.bottom" thickness={0.2} routingPhaseIndex={1}
      pcbPath={["C_KEYS_BULK.pin2","KEYS_BULK_GND.bottom"]}/>
    {/* Pi J8 already supplies the I2C pull-ups. No parallel pull-ups fitted. */}
    {buttons.map((b,i) => (
      <Fragment key={b.name}>
        <TS_1187A_B_A_B name={b.name} pcbX={b.x} pcbY={b.y}
          schX={1+(i%4)*5} schY={-3-Math.floor(i/4)*6} schSectionName="controls"
          internallyConnectedPins={[["pin1","pin2"],["pin3","pin4"]]}
        />
        <trace from={`${b.name}.pin1`} to={`U_KEYS.${b.port}`} thickness={0.2} routingPhaseIndex={0}/>
        <Wire from={`${b.name}.pin3`} net="GND" phase={1}/>
        <silkscreentext pcbSx={{"& silkscreentext":{visibility:"visible"}}} text={b.label} pcbX={b.x} pcbY={b.y-4.6} fontSize={1} />
      </Fragment>
    ))}

    <Fragment><testpoint name="TP_GND" pcbX={-20} pcbY={47} layer="bottom" padDiameter={1.5} holeDiameter={0.6} footprint={<footprint><platedhole shape="circle" holeDiameter={0.6} outerDiameter={1.5} portHints={["pin1"]}/></footprint>} schX={-20} schY={26} schSectionName="host" /><Connections name="TP_GND" connections={{pin1:"net.GND"}}/></Fragment>
    <Fragment><testpoint name="TP_5V" pcbX={-14} pcbY={47} layer="bottom" padDiameter={1.5} holeDiameter={0.6} footprint={<footprint><platedhole shape="circle" holeDiameter={0.6} outerDiameter={1.5} portHints={["pin1"]}/></footprint>} schX={-26} schY={26} schSectionName="host" /><Connections name="TP_5V" connections={{pin1:"net.V5V"}}/></Fragment>
    <Fragment><testpoint name="TP_3V3" pcbX={-8} pcbY={47} layer="bottom" padDiameter={1.5} holeDiameter={0.6} footprint={<footprint><platedhole shape="circle" holeDiameter={0.6} outerDiameter={1.5} portHints={["pin1"]}/></footprint>} schX={-32} schY={26} schSectionName="host" /><Connections name="TP_3V3" connections={{pin1:"net.V3V3"}}/></Fragment>
    {[-46,46].flatMap(x=>[-58,58].map(y=><Fragment key={`${x},${y}`}><hole name={`MOUNT_${x}_${y}`} diameter={2.7} pcbX={x} pcbY={y} /></Fragment>))}
    <fiducial padDiameter={1} name="FID1" pcbX={-38} pcbY={-49} />
    <fiducial padDiameter={1} name="FID2" pcbX={38} pcbY={49} />
    <fiducial padDiameter={1} name="FID3" pcbX={-38} pcbY={49} />
    <fiducial padDiameter={1} name="FID4" pcbX={-38} pcbY={-49} layer="bottom" />
    <fiducial padDiameter={1} name="FID5" pcbX={38} pcbY={49} layer="bottom" />
    <fiducial padDiameter={1} name="FID6" pcbX={-38} pcbY={49} layer="bottom" />
    {/* Keep ground copper out of the fiducials' 2mm mask openings. */}
    {[[-38,-49],[38,49],[-38,49]].map(([x,y],i)=><Fragment key={`fid-clearance${i}`}>
      <keepout shape="circle" pcbX={x} pcbY={y} radius={1.2} layers={["top","bottom"]}
        allowPlacements excludeRefs={["FID1","FID2","FID3","FID4","FID5","FID6"]}/>
    </Fragment>)}
    {[[-39,40],[-39,-40],[39,40],[39,-40],[0,55],[0,-56],[-20,0],[20,0]].map(([x,y],i)=><Fragment key={`stitch${i}`}>
      <via name={`GND_STITCH_${i}`} pcbX={x} pcbY={y} holeDiameter={0.3} outerDiameter={0.65}
        fromLayer="top" toLayer="bottom" connectsTo="net.GND" />
    </Fragment>)}
    <pcbnoterect pcbX={0} pcbY={28} width={92.44} height={61} strokeWidth={0.15} />
    <silkscreentext pcbSx={{"& silkscreentext":{visibility:"visible"}}} text="3.5 INCH LCD / FPC" pcbX={0} pcbY={29} fontSize={2} />
    {[{text:"GND",x:-20,y:44.5},{text:"5V",x:-14,y:44.5},{text:"3V3",x:-8,y:44.5},
      {text:"SPEAKER",x:18,y:22.5},{text:"BAT / NTC",x:36,y:34.5},{text:"OFF",x:40,y:45}].map(label=>
      <Fragment key={label.text}><silkscreentext pcbSx={{"& silkscreentext":{visibility:"visible"}}}
        text={label.text} pcbX={label.x} pcbY={label.y} layer="bottom" fontSize={1}/></Fragment>)}
    {[{text:"+",x:38,y:25.46},{text:"-",x:38,y:28},{text:"NTC",x:38,y:30.54},
      {text:"+",x:19.27,y:20},{text:"-",x:16.73,y:20}].map(label=>
      <Fragment key={`polarity-${label.x}-${label.y}`}><silkscreentext
        pcbSx={{"& silkscreentext":{visibility:"visible"}}} text={label.text}
        pcbX={label.x} pcbY={label.y} layer="bottom" fontSize={1}/></Fragment>)}
    <silkscreentext pcbSx={{"& silkscreentext":{visibility:"visible"}}} text="G350 LINUX  /  REV A" pcbX={0} pcbY={-59} fontSize={1.2} />
    <silkscreentext pcbSx={{"& silkscreentext":{visibility:"visible"}}} text="J8 PIN 1: 3V3" pcbX={24} pcbY={39} layer="bottom" fontSize={1} />
    <copperpour layer="top" connectsTo="net.GND" clearance={0.2} boardEdgeMargin={0.6} />
    <copperpour layer="inner1" connectsTo="net.GND" clearance={0.2} boardEdgeMargin={0.6} />
    <copperpour layer="inner2" connectsTo="net.GND" clearance={0.2} boardEdgeMargin={0.6} />
    <copperpour layer="bottom" connectsTo="net.GND" clearance={0.2} boardEdgeMargin={0.6} />
  </board>
)
