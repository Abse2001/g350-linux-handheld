import { Fragment } from "react"

// Drawn here from Raspberry Pi's J8 pinout and 65 x 30 mm mechanical drawing.
// This is a physical host interface, not an imported complete SBC circuit.
export const piPins: Record<number, string> = {
  1:"V3V3",2:"V5V",3:"SDA",4:"V5V",5:"SCL",6:"GND",9:"GND",
  12:"I2S_BCLK",13:"LCD_RESET",14:"GND",15:"LCD_DC",16:"LCD_BL",
  19:"SPI_MOSI",20:"GND",21:"SPI_MISO",22:"TOUCH_IRQ",23:"SPI_SCLK",
  24:"LCD_CS",25:"GND",29:"CHARGING_N",30:"GND",31:"BAT_ALERT_N",
  32:"USB_GOOD_N",34:"GND",35:"I2S_LRCLK",37:"AMP_ENABLE",39:"GND",40:"I2S_DIN",
}

export function PiZero2W() {
  return <Fragment>
    <via name="KEYS_SUPPLY" pcbX={5.2} pcbY={-17} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="top" toLayer="bottom" connectsTo="net.V3V3"/>
    <via name="RESET_SUPPLY" pcbX={-5.5} pcbY={1} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="bottom" toLayer="top" connectsTo="net.V3V3"/>
    <trace from="TP_3V3.pin1" to="KEYS_SUPPLY.top" thickness={0.3} routingPhaseIndex={1} maxLength={200}
      pcbPathRelativeTo="TP_3V3.pin1"
      pcbPath={["TP_3V3.pin1",{x:0,y:-1.5},{x:-37.8,y:-1.5},
        {x:-37.8,y:-67},{x:13.2,y:-67},"KEYS_SUPPLY.top"]}/>
    <trace from="KEYS_SUPPLY.bottom" to="C_KEYS_BULK.pin1" thickness={0.3} routingPhaseIndex={1}
      pcbPath={["KEYS_SUPPLY.bottom","C_KEYS_BULK.pin1"]}/>
    <trace from="R_RESET.pin2" to="RESET_SUPPLY.bottom" thickness={0.2} routingPhaseIndex={1}
      pcbPathRelativeTo="R_RESET.pin2"
      pcbPath={["R_RESET.pin2","RESET_SUPPLY.bottom"]}/>
    <trace from="RESET_SUPPLY.top" to="KEYS_SUPPLY.top" thickness={0.2} routingPhaseIndex={1}
      pcbPathRelativeTo="RESET_SUPPLY.top"
      pcbPath={["RESET_SUPPLY.top",{x:0,y:-18},"KEYS_SUPPLY.top"]}/>
    <trace from="TP_3V3.pin1" to="J_PI.pin1" thickness={0.2} routingPhaseIndex={1} maxLength={140}
      pcbPathRelativeTo="TP_3V3.pin1"
      pcbPath={["TP_3V3.pin1",{x:0,y:10},{x:44.4,y:10},{x:44.4,y:-5.2},
        {x:44.4,y:-5.2,via:true,toLayer:"bottom"},{x:44.4,y:-5.2},
        {x:42.3,y:-5.2},{x:42.3,y:-6.9},{x:42.3,y:-6.9,via:true,toLayer:"top"},
        {x:42.3,y:-6.9},{x:42.3,y:-9.05},{x:42.3,y:-9.05,via:true,toLayer:"bottom"},
        {x:42.3,y:-9.05},{x:40.7,y:-9.05},{x:40.7,y:-9.05,via:true,toLayer:"top"},
        {x:40.7,y:-9.05},{x:40.7,y:-8.8},{x:32.13,y:-8.8},{x:32.13,y:-8.4},
        {x:32.13,y:-8.4,via:true,toLayer:"bottom"},{x:32.13,y:-8.4},"J_PI.pin1"]}/>
    {/* Keep the Pi load feed wide around the charger and signal escapes. */}
    <trace from="TP_5V.pin1" to="J_PI.pin2" thickness={0.8} routingPhaseIndex={1} maxLength={160}
      pcbPathRelativeTo="TP_5V.pin1"
      pcbPath={["TP_5V.pin1",{x:0,y:14},{x:54.2,y:14},{x:54.2,y:-8},{x:54.2,y:-8,via:true,toLayer:"bottom"},
        {x:54.2,y:-8},{x:46.6,y:-8},{x:46.6,y:-8,via:true,toLayer:"top"},{x:46.6,y:-8},
        {x:40,y:-8},{x:40,y:-8,via:true,toLayer:"bottom"},{x:40,y:-8},
        {x:40,y:-13.27},"J_PI.pin2"]}/>
    <trace from="J_PI.pin2" to="J_PI.pin4" thickness={0.8} routingPhaseIndex={1}
      pcbPath={["J_PI.pin2","J_PI.pin4"]}/>
    <chip name="J_PI" layer="bottom" pcbX={0} pcbY={35}
      schX={-32} schY={12} schSectionName="host"
      manufacturerPartNumber="2x20 2.54mm GPIO ribbon header"
      pinAttributes={{
        pin1:{providesPower:true,providesVoltage:"3.3V"},
        pin2:{requiresPower:true,requiresVoltage:"5V"},
        pin4:{requiresPower:true,requiresVoltage:"5V"},
        ...Object.fromEntries([6,9,14,20,25,30,34,39].map(p=>[`pin${p}`,{requiresGround:true}])),
      }}
      pinLabels={Object.fromEntries(Array.from({length:40},(_,i)=>[`pin${i+1}`, [`J8_${i+1}`]]))}
      footprint={<footprint insertionDirection="from_above">
        {Array.from({length:40},(_,i)=><Fragment key={i}>
          <platedhole shape="circle" holeDiameter={1} outerDiameter={1.8}
            pcbX={-24.13+Math.floor(i/2)*2.54} pcbY={i%2===0?1.27:-1.27}
            portHints={[`pin${i+1}`]} />
        </Fragment>)}
        <silkscreenrect width={51.3} height={5.1} strokeWidth={0.15}/>
        <silkscreentext pcbSx={{"& silkscreentext":{visibility:"visible"}}} text="1" pcbX={-25.8} pcbY={1.27} fontSize={1}/>
      </footprint>}
    />
    {Object.entries(piPins).map(([pin,net]) => <trace key={pin}
      from={`J_PI.pin${pin}`} to={`net.${net}`}
      thickness={net==="V5V"?0.8:net==="GND"?0.4:0.2}
      routingPhaseIndex={["V5V","GND","V3V3"].includes(net)?1:
        /^(SPI|LCD|I2S|AMP|TOUCH)/.test(net)?2:0} />)}
    <pcbnoterect pcbX={0} pcbY={22.23} width={65} height={30}
      layer="bottom" strokeWidth={0.15} />
    <silkscreentext pcbSx={{"& silkscreentext":{visibility:"visible"}}} text="PI ZERO 2 W / RIBBON" pcbX={0} pcbY={23}
      layer="bottom" fontSize={1} />
    {[-29,29].flatMap(x=>[10.73,33.73].map(y=><Fragment key={`${x},${y}`}>
      <hole name={`PI_MOUNT_${x}_${y}`} diameter={2.75} pcbX={x} pcbY={y} />
    </Fragment>))}
  </Fragment>
}
