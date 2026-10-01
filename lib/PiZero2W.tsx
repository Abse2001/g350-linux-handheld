import { Fragment } from "react"

// Drawn here from Raspberry Pi's J8 pinout and 65 x 30 mm mechanical drawing.
// This is a physical host interface, not an imported complete SBC circuit.
export const piPins: Record<number, string> = {
  1:"V3V3",2:"V5V",3:"SDA",4:"V5V",5:"SCL",6:"GND",9:"GND",
  12:"I2S_BCLK",13:"LCD_RESET",14:"GND",15:"LCD_DC",16:"LCD_BL",
  17:"V3V3",18:"TOUCH_RESET",19:"SPI_MOSI",20:"GND",21:"SPI_MISO",22:"TOUCH_IRQ",23:"SPI_SCLK",
  24:"LCD_CS",25:"GND",29:"CHARGING_N",30:"GND",31:"BAT_ALERT_N",
  32:"USB_GOOD_N",34:"GND",35:"I2S_LRCLK",37:"AMP_ENABLE",39:"GND",40:"I2S_DIN",
}

export function PiZero2W() {
  return <Fragment>
    <chip name="J_PI" layer="bottom" pcbX={0} pcbY={35}
      schX={-32} schY={12} schSectionName="host"
      manufacturerPartNumber="2x20 2.54mm GPIO ribbon header"
      pinAttributes={{
        pin1:{providesPower:true,providesVoltage:"3.3V"},
        pin17:{providesPower:true,providesVoltage:"3.3V"},
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
        <silkscreentext pcbSx={{"& silkscreentext":{visibility:"visible"}}} text="1" pcbX={-25.8} pcbY={1.27} fontSize={0.8}/>
      </footprint>}
    />
    {Object.entries(piPins).map(([pin,net]) => <trace key={pin}
      from={`J_PI.pin${pin}`} to={`net.${net}`}
      thickness={net==="V5V"?0.8:net==="GND"?0.4:0.2}
      routingPhaseIndex={["V5V","GND","V3V3"].includes(net)?2:
        /^(SPI|LCD|I2S|AMP|TOUCH)/.test(net)?1:0} />)}
    <pcbnoterect pcbX={0} pcbY={22.23} width={65} height={30}
      layer="bottom" strokeWidth={0.15} />
    <silkscreentext pcbSx={{"& silkscreentext":{visibility:"visible"}}} text="PI ZERO 2 W / RIBBON" pcbX={0} pcbY={23}
      layer="bottom" fontSize={1} />
    {[-29,29].flatMap(x=>[10.73,33.73].map(y=><Fragment key={`${x},${y}`}>
      <hole name={`PI_MOUNT_${x}_${y}`} diameter={2.75} pcbX={x} pcbY={y} />
    </Fragment>))}
  </Fragment>
}
