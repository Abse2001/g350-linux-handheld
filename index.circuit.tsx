import { Connections } from "./lib/Connections"
import { Fragment } from "react"
import { MCP23017_E_SO } from "./imports/MCP23017_E_SO"
import { TS_1187A_B_A_B } from "./imports/TS_1187A_B_A_B"
import { PiZero2W } from "./lib/PiZero2W"
import { Power } from "./lib/Power"
import { Audio } from "./lib/Audio"

// All coordinates are mm. Front controls are top; support electronics are rear.
const buttons = [
  {name:"SW_UP",    x:-24,y:-19,port:"GPA0",label:"UP"},
  {name:"SW_DOWN",  x:-24,y:-39,port:"GPA1",label:"DOWN"},
  {name:"SW_LEFT",  x:-34,y:-29,port:"GPA2",label:"LEFT"},
  {name:"SW_RIGHT", x:-14,y:-29,port:"GPA3",label:"RIGHT"},
  {name:"SW_A",     x: 34,y:-29,port:"GPA4",label:"A"},
  {name:"SW_B",     x: 24,y:-39,port:"GPA5",label:"B"},
  {name:"SW_X",     x: 24,y:-19,port:"GPA6",label:"X"},
  {name:"SW_Y",     x: 14,y:-29,port:"GPA7",label:"Y"},
  {name:"SW_SELECT",x:-12,y:-52,port:"GPB0",label:"SELECT"},
  {name:"SW_START", x: 12,y:-52,port:"GPB1",label:"START"},
  {name:"SW_MENU",  x:  0,y:-42,port:"GPB2",label:"MENU"},
] as const

const lcdPins = ["TOUCH_IRQ_NC","TOUCH_CS","LCD_BL","LCD_RESET","LCD_DC","LCD_CS","SPI_SCLK","SPI_MOSI","SPI_MISO","GND","V5V"]
const passivePart = (part:string) => ({jlcpcb:[part]})
const Wire = ({from,net,width=0.2,phase=0}:{from:string,net:string,width?:number,phase?:number}) =>
  <trace from={from} to={`net.${net}`} thickness={width} routingPhaseIndex={phase} />

export default () => (
  <board title="G350 Linux Handheld — Pi Zero 2 W Carrier Rev A"
    width={86} height={124} thickness={1.6} layers={4} borderRadius={3}
    material="fr4" fabricatorPreset="jlcpcb_standard" solderMaskColor="green"
    minTraceWidth={0.15} nominalTraceWidth={0.2}
    minTraceToPadEdgeClearance={0.2} minPadEdgeToPadEdgeClearance={0.2}
    minBoardEdgeClearance={0.5} minTraceToHoleEdgeClearance={0.5}
    minViaHoleDiameter={0.3} minViaPadDiameter={0.65}
    allowBlindAndBuriedVias={false} isViaInPadAllowed={false} defaultViaTenting
    autorouter="auto_local" autorouterEffortLevel="2x"
    pcbStyle={{viaHoleDiameter:0.3,viaPadDiameter:0.65,silkscreenFontSize:0.8}}
  >
    <schematicsection name="host" displayName="Linux host — physical Pi J8 pins" />
    <schematicsection name="display" displayName="ST7796S display harness (Waveshare LCD G)" />
    <schematicsection name="audio" displayName="I2S audio" />
    <schematicsection name="controls" displayName="Front controls — MCP23017 address 0x20" />
    <schematicsection name="power" displayName="USB-C charger and 5V boost" />
    <schematicsection name="battery" displayName="MAX17048 fuel gauge" />

    <schematicsection name="decoupling" displayName="Rail bypass capacitors" />

    <autoroutingphase name="CONTROLS" phaseIndex={0}/>
    <autoroutingphase name="DISPLAY_AUDIO" phaseIndex={1}/>
    <autoroutingphase name="POWER" phaseIndex={2}/>
    <net name="GND" isGroundNet nominalTraceWidth={0.5} routingPhaseIndex={2}/>
    <net name="V3V3" isPowerNet routingPhaseIndex={2}/>
    <net name="V5V" isPowerNet routingPhaseIndex={2}/>
    <net name="USB_5V" isPowerNet routingPhaseIndex={2}/>
    {["I2S_DIN","I2S_BCLK","I2S_LRCLK","AMP_ENABLE","LCD_RESET","LCD_DC","LCD_BL",
      "SPI_MOSI","SPI_MISO","SPI_SCLK","LCD_CS","TOUCH_CS"].map(n=><Fragment key={n}>
      <net name={n} routingPhaseIndex={1}/></Fragment>)}
    {["SDA","SCL","CHARGING_N","BAT_ALERT_N","USB_GOOD_N"].map(n=><Fragment key={n}>
      <net name={n} routingPhaseIndex={0}/></Fragment>)}

    <PiZero2W />
    <Audio />
    <Power />

    <pinheader name="J_LCD" pinCount={11} pitch={2.54} gender="male"
      pcbX={-36} pcbY={15} pcbOrientation="vertical" layer="bottom"
      schX={-15} schY={14} schSectionName="display"
      manufacturerPartNumber="1x11 2.54mm display harness header"
    />
    {lcdPins.slice(1).map((net,i)=><Wire key={net} from={`J_LCD.pin${i+2}`} net={net}
      width={net==="V5V"?0.6:net==="GND"?0.5:0.25} phase={net==="V5V"||net==="GND"?2:1} />)}

    <MCP23017_E_SO name="U_KEYS" pcbX={0} pcbY={-8} layer="bottom"
      schX={-12} schY={-8} schWidth={2.245} schHeight={3} schSectionName="controls"
    />
    <Wire from="U_KEYS.VDD" net="V3V3" width={0.4} phase={2}/>
    {["VSS","A0","A1","A2"].map(p=><Wire key={p} from={`U_KEYS.${p}`} net="GND" width={0.4} phase={2}/>)}
    <Wire from="U_KEYS.SDA" net="SDA" />
    <Wire from="U_KEYS.SCL" net="SCL" />
    <Fragment><resistor name="R_RESET" schRotation={90} resistance="10k" footprint="0603" supplierPartNumbers={passivePart("C25804")}
      pcbX={6} pcbY={1} layer="bottom" schX={-5} schY={0} schSectionName="controls"
       /><Connections name="R_RESET" connections={{pin1:"U_KEYS.N_RESET",pin2:"net.V3V3"}}/></Fragment>
    <Fragment><capacitor name="C_KEYS" schRotation={-90} capacitance="100nF" footprint="0603" supplierPartNumbers={passivePart("C14663")}
      pcbX={2} pcbY={-17} layer="bottom" schX={-20} schY={-8} schSectionName="controls"
       /><Connections name="C_KEYS" connections={{pin1:"net.V3V3",pin2:"net.GND"}}/></Fragment>
    <Fragment><capacitor name="C_KEYS_BULK" schRotation={-90} capacitance="10uF" footprint="0805" supplierPartNumbers={passivePart("C15850")}
      pcbX={7} pcbY={-17} layer="bottom" schX={-20} schY={-12} schSectionName="controls"
       /><Connections name="C_KEYS_BULK" connections={{pin1:"net.V3V3",pin2:"net.GND"}}/></Fragment>
    {/* Pi J8 already supplies the I2C pull-ups. No parallel pull-ups fitted. */}
    {buttons.map((b,i) => (
      <Fragment key={b.name}>
        <TS_1187A_B_A_B name={b.name} pcbX={b.x} pcbY={b.y}
          schX={1+(i%4)*5} schY={-3-Math.floor(i/4)*6} schSectionName="controls"
          internallyConnectedPins={[["pin1","pin2"],["pin3","pin4"]]}
        />
        <trace from={`${b.name}.pin1`} to={`U_KEYS.${b.port}`} thickness={0.2} routingPhaseIndex={0}/>
        <Wire from={`${b.name}.pin3`} net="GND" phase={2}/>
        <silkscreentext text={b.label} pcbX={b.x} pcbY={b.y-4.6} fontSize={0.9} />
      </Fragment>
    ))}

    <Fragment><testpoint name="TP_GND" pcbX={-20} pcbY={47} layer="bottom" padDiameter={1.5}  schX={-20} schY={26} schSectionName="host" /><Connections name="TP_GND" connections={{pin1:"net.GND"}}/></Fragment>
    <Fragment><testpoint name="TP_5V" pcbX={-14} pcbY={47} layer="bottom" padDiameter={1.5}  schX={-26} schY={26} schSectionName="host" /><Connections name="TP_5V" connections={{pin1:"net.V5V"}}/></Fragment>
    <Fragment><testpoint name="TP_3V3" pcbX={-8} pcbY={47} layer="bottom" padDiameter={1.5}  schX={-32} schY={26} schSectionName="host" /><Connections name="TP_3V3" connections={{pin1:"net.V3V3"}}/></Fragment>
    {[-39,39].flatMap(x=>[-58,58].map(y=><Fragment key={`${x},${y}`}><hole name={`MOUNT_${x}_${y}`} diameter={2.7} pcbX={x} pcbY={y} /></Fragment>))}
    <fiducial padDiameter={1} name="FID1" pcbX={-38} pcbY={-49} />
    <fiducial padDiameter={1} name="FID2" pcbX={38} pcbY={49} />
    <fiducial padDiameter={1} name="FID3" pcbX={-38} pcbY={49} />
    <silkscreenrect pcbX={0} pcbY={28} width={83.79} height={54.86} strokeWidth={0.15} />
    <silkscreentext text="3.5 INCH LCD G" pcbX={0} pcbY={29} fontSize={2} />
    <silkscreentext text="G350 LINUX  /  REV A" pcbX={0} pcbY={-59} fontSize={1.2} />
    <silkscreentext text="J8 PIN 1: 3V3" pcbX={-20} pcbY={39} layer="bottom" fontSize={0.8} />
    <copperpour layer="top" connectsTo="net.GND" clearance={0.2} boardEdgeMargin={0.6} />
    <copperpour layer="inner1" unbroken connectsTo="net.GND" clearance={0.2} boardEdgeMargin={0.6} />
    <copperpour layer="bottom" connectsTo="net.GND" clearance={0.2} boardEdgeMargin={0.6} />
  </board>
)
