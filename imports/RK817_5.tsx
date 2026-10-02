import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["SCL"],
  pin2: ["SDA"],
  pin3: ["LDO7"],
  pin4: ["VCC7"],
  pin5: ["LDO8"],
  pin6: ["LDO9"],
  pin7: ["INT"],
  pin8: ["FB2"],
  pin9: ["SW2"],
  pin10: ["VCC2"],
  pin11: ["VCC1"],
  pin12: ["SW1"],
  pin13: ["FB1"],
  pin14: ["LRCLK"],
  pin15: ["BCLK"],
  pin16: ["MCLK"],
  pin17: ["SDI"],
  pin18: ["SDO","PDMDATA"],
  pin19: ["PDMCLK"],
  pin20: ["LDO3"],
  pin21: ["LDO2"],
  pin22: ["VCC5"],
  pin23: ["LDO1"],
  pin24: ["VCC3"],
  pin25: ["SW3"],
  pin26: ["VBUCK3"],
  pin27: ["FB3"],
  pin28: ["LDO4"],
  pin29: ["LDO5"],
  pin30: ["VCC6"],
  pin31: ["LDO6"],
  pin32: ["SPKP_OUT"],
  pin33: ["VCC_SPK_HP"],
  pin34: ["SPKN_OUT"],
  pin35: ["VCC_CPVSS"],
  pin36: ["CPN"],
  pin37: ["CPP"],
  pin38: ["VCC_CPVDD"],
  pin39: ["HPL_OUT"],
  pin40: ["HP_SNS"],
  pin41: ["HPR_OUT"],
  pin42: ["MICIN","MIC1N"],
  pin43: ["MICIP","MIC1P"],
  pin44: ["VCC_1P8A"],
  pin45: ["VCC_RTC"],
  pin46: ["VREF"],
  pin47: ["GNDREF"],
  pin48: ["VCC_1P8D"],
  pin49: ["SLEEP"],
  pin50: ["XIN"],
  pin51: ["XOUT"],
  pin52: ["PWRON"],
  pin53: ["SW5"],
  pin54: ["MIDU","BOOST"],
  pin55: ["USB","OTG"],
  pin56: ["BAT1"],
  pin57: ["BAT2"],
  pin58: ["SYS1"],
  pin59: ["SYS2"],
  pin60: ["GATE","GPIO_GATE"],
  pin61: ["TS","GPIO_TS"],
  pin62: ["SNSP"],
  pin63: ["SNSN"],
  pin64: ["FB4"],
  pin65: ["SW4"],
  pin66: ["VCC4"],
  pin67: ["RESETB"],
  pin68: ["CLK32K"],
  pin69: ["EP","GND"]
} as const

const pinAttributes = {
  pin4: {requiresPower: true},
  pin10: {requiresPower: true},
  pin11: {requiresPower: true},
  pin22: {requiresPower: true},
  pin24: {requiresPower: true},
  pin30: {requiresPower: true},
  pin47: {requiresGround: true},
  pin66: {requiresPower: true},
  pin69: {requiresGround: true}
} as const

// VCC_1P8A/D (44/48) are internal-regulator filter rails, decoupled locally.
// Do not drive them from a second external regulator. RK817 Rev2.1's
// LDO1P8A_VSEL register and the reference application establish this role.

export const RK817_5 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C5179490"
  ]
}}
      manufacturerPartNumber="RK817-5"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-3.40741mm" pcbY="2.800096mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin2"]} pcbX="-3.40741mm" pcbY="2.450084mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin3"]} pcbX="-3.40741mm" pcbY="2.100072mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin4"]} pcbX="-3.40741mm" pcbY="1.75006mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin5"]} pcbX="-3.40741mm" pcbY="1.400048mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin6"]} pcbX="-3.40741mm" pcbY="1.050036mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin7"]} pcbX="-3.40741mm" pcbY="0.700024mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin8"]} pcbX="-3.40741mm" pcbY="0.350012mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin9"]} pcbX="-3.40741mm" pcbY="-0mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin10"]} pcbX="-3.40741mm" pcbY="-0.350012mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin11"]} pcbX="-3.40741mm" pcbY="-0.700024mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin12"]} pcbX="-3.40741mm" pcbY="-1.050036mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin13"]} pcbX="-3.40741mm" pcbY="-1.400048mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin14"]} pcbX="-3.40741mm" pcbY="-1.75006mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin15"]} pcbX="-3.40741mm" pcbY="-2.100072mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin16"]} pcbX="-3.40741mm" pcbY="-2.450084mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin17"]} pcbX="-3.40741mm" pcbY="-2.800096mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin18"]} pcbX="-2.800096mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin19"]} pcbX="-2.450084mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin20"]} pcbX="-2.100072mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin21"]} pcbX="-1.75006mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin22"]} pcbX="-1.400048mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin23"]} pcbX="-1.050036mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin24"]} pcbX="-0.700024mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin25"]} pcbX="-0.350012mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin26"]} pcbX="0mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin27"]} pcbX="0.350012mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin28"]} pcbX="0.700024mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin29"]} pcbX="1.050036mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin30"]} pcbX="1.400048mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin31"]} pcbX="1.75006mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin32"]} pcbX="2.100072mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin33"]} pcbX="2.450084mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin34"]} pcbX="2.800096mm" pcbY="-3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin35"]} pcbX="3.40741mm" pcbY="-2.800096mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin36"]} pcbX="3.40741mm" pcbY="-2.450084mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin37"]} pcbX="3.40741mm" pcbY="-2.100072mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin38"]} pcbX="3.40741mm" pcbY="-1.75006mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin39"]} pcbX="3.40741mm" pcbY="-1.400048mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin40"]} pcbX="3.40741mm" pcbY="-1.050036mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin41"]} pcbX="3.40741mm" pcbY="-0.700024mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin42"]} pcbX="3.40741mm" pcbY="-0.350012mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin43"]} pcbX="3.40741mm" pcbY="-0mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin44"]} pcbX="3.40741mm" pcbY="0.350012mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin45"]} pcbX="3.40741mm" pcbY="0.700024mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin46"]} pcbX="3.40741mm" pcbY="1.050036mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin47"]} pcbX="3.40741mm" pcbY="1.400048mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin48"]} pcbX="3.40741mm" pcbY="1.75006mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin49"]} pcbX="3.40741mm" pcbY="2.100072mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin50"]} pcbX="3.40741mm" pcbY="2.450084mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin51"]} pcbX="3.40741mm" pcbY="2.800096mm" width="0.7400036mm" height="0.1500124mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin52"]} pcbX="2.800096mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin53"]} pcbX="2.450084mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin54"]} pcbX="2.100072mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin55"]} pcbX="1.75006mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin56"]} pcbX="1.400048mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin57"]} pcbX="1.050036mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin58"]} pcbX="0.700024mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin59"]} pcbX="0.350012mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin60"]} pcbX="0mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin61"]} pcbX="-0.350012mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin62"]} pcbX="-0.700024mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin63"]} pcbX="-1.050036mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin64"]} pcbX="-1.400048mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin65"]} pcbX="-1.75006mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin66"]} pcbX="-2.100072mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin67"]} pcbX="-2.450084mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin68"]} pcbX="-2.800096mm" pcbY="3.40741mm" width="0.1500124mm" height="0.7400036mm" radius="0.0750062mm" shape="pill" />
<smtpad portHints={["pin69"]} pcbX="0mm" pcbY="-0mm" width="5.499989mm" height="5.499989mm" shape="rect" />
<via pcbX="-0.999998mm" pcbY="0.999998mm" outerDiameter="0.5999988mm" holeDiameter="0.2999994mm" layers={["top","bottom"]} />
<via pcbX="0mm" pcbY="0.999998mm" outerDiameter="0.5999988mm" holeDiameter="0.2999994mm" layers={["top","bottom"]} />
<via pcbX="0.999998mm" pcbY="0.999998mm" outerDiameter="0.5999988mm" holeDiameter="0.2999994mm" layers={["top","bottom"]} />
<via pcbX="-0.999998mm" pcbY="-0mm" outerDiameter="0.5999988mm" holeDiameter="0.2999994mm" layers={["top","bottom"]} />
<via pcbX="0mm" pcbY="-0mm" outerDiameter="0.5999988mm" holeDiameter="0.2999994mm" layers={["top","bottom"]} />
<via pcbX="0.999998mm" pcbY="-0mm" outerDiameter="0.5999988mm" holeDiameter="0.2999994mm" layers={["top","bottom"]} />
<via pcbX="-0.999998mm" pcbY="-0.999998mm" outerDiameter="0.5999988mm" holeDiameter="0.2999994mm" layers={["top","bottom"]} />
<via pcbX="0mm" pcbY="-0.999998mm" outerDiameter="0.5999988mm" holeDiameter="0.2999994mm" layers={["top","bottom"]} />
<via pcbX="0.999998mm" pcbY="-0.999998mm" outerDiameter="0.5999988mm" holeDiameter="0.2999994mm" layers={["top","bottom"]} />
<silkscreenpath route={[{"x":-3.5761929999999893,"y":3.0503875999999934},{"x":-3.5761929999999893,"y":3.5761929999999893},{"x":-3.0503875999999934,"y":3.5761929999999893}]} />
<silkscreenpath route={[{"x":3.5761930000000035,"y":3.0503875999999934},{"x":3.5761930000000035,"y":3.5761929999999893},{"x":3.0503876000000076,"y":3.5761929999999893}]} />
<silkscreenpath route={[{"x":3.5761930000000035,"y":-3.050387600000022},{"x":3.5761930000000035,"y":-3.5761930000000035},{"x":3.0503876000000076,"y":-3.5761930000000035}]} />
<silkscreenpath route={[{"x":-3.5761929999999893,"y":-3.050387600000022},{"x":-3.5761929999999893,"y":-3.5761930000000035},{"x":-3.0503875999999934,"y":-3.5761930000000035}]} />
<silkscreencircle pcbX="-4.03987mm" pcbY="2.910078mm" radius="0.147574mm" />
<silkscreentext text="{NAME}" pcbX="-0.2032mm" pcbY="4.7846mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-4.4410000000000025,"y":4.034599999999983},{"x":4.0345999999999975,"y":4.034599999999983},{"x":4.0345999999999975,"y":-4.009200000000007},{"x":-4.4410000000000025,"y":-4.009200000000007},{"x":-4.4410000000000025,"y":4.034599999999983}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C5179490.obj?uuid=93d721db4a97464fae1dedc1ca2b7275",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C5179490.step?uuid=93d721db4a97464fae1dedc1ca2b7275",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
