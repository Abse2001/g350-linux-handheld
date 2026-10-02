import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["OSC1"],
  pin2: ["GND1"],
  pin3: ["OSC2"],
  pin4: ["GND2"]
} as const

const pinAttributes = {
  pin2: {requiresGround: true},
  pin4: {requiresGround: true}
} as const

export const SX32Y024000BC1T = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      symbol={
        <symbol>
          <schematicpath points={[{"x":-0.1,"y":-0.08},{"x":-0.1,"y":0.08}]} strokeColor="#880011" />
          <schematicpath points={[{"x":0.06,"y":-0.14},{"x":-0.06,"y":-0.14}]} strokeColor="#880011" />
          <schematicpath points={[{"x":0.1,"y":-0.08},{"x":0.1,"y":0.08}]} strokeColor="#880011" />
          <schematicpath points={[{"x":-0.06,"y":-0.14},{"x":-0.06,"y":0.14},{"x":0.06,"y":0.14},{"x":0.06,"y":-0.14}]} strokeColor="#880011" />
          <schematicpath points={[{"x":0.4,"y":0.2},{"x":0.2,"y":0.2},{"x":0.2,"y":0},{"x":0.12,"y":0}]} strokeColor="#880011" />
          <schematicpath points={[{"x":-0.4,"y":-0.2},{"x":-0.2,"y":-0.2},{"x":-0.2,"y":0},{"x":-0.12,"y":0}]} strokeColor="#880011" />
          <schematicpath points={[{"x":0.1,"y":-0.14},{"x":0.1,"y":0.14}]} strokeColor="#880011" />
          <schematicpath points={[{"x":-0.1,"y":-0.14},{"x":-0.1,"y":0.14}]} strokeColor="#880011" />
          <schematicpath points={[{"x":0.06,"y":0.14},{"x":0.06,"y":-0.14},{"x":-0.06,"y":-0.14},{"x":-0.06,"y":0.14},{"x":0.06,"y":0.14}]} strokeColor="#880011" />
          <port name="pin4" pinNumber={4} aliases={["GND2","GND"]} direction="left" schX={-0.6} schY={0.2} schStemLength={0.2} />
          <port name="pin2" pinNumber={2} aliases={["GND1","GND"]} direction="right" schX={0.6} schY={-0.2} schStemLength={0.2} />
          <schematicrect schX={0} schY={0} width={0.8} height={0.8} strokeWidth={0.02} color="#880000" />
          <port name="pin1" pinNumber={1} aliases={["OSC1"]} direction="left" schX={-0.6} schY={-0.2} schStemLength={0.2} />
          <port name="pin3" pinNumber={3} aliases={["OSC2"]} direction="right" schX={0.6} schY={0.2} schStemLength={0.2} />
        </symbol>
      }
      supplierPartNumbers={{
  "jlcpcb": [
    "C271629"
  ]
}}
      manufacturerPartNumber="SX32Y024000BC1T"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-1.100074mm" pcbY="-0.87503mm" width="1.3999972mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="1.100074mm" pcbY="-0.87503mm" width="1.3999972mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="1.100074mm" pcbY="0.87503mm" width="1.3999972mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-1.100074mm" pcbY="0.87503mm" width="1.3999972mm" height="1.1999976mm" shape="rect" />
<silkscreenpath route={[{"x":-2.029459999999972,"y":1.7213071999999556},{"x":-2.029459999999972,"y":-1.6786859999999706},{"x":2.070531800000026,"y":-1.6786859999999706},{"x":2.070531800000026,"y":1.7213071999999556},{"x":-2.029459999999972,"y":1.7213071999999556}]} />
<silkscreenpath route={[{"x":-2.286000000000058,"y":-1.396872999999914},{"x":-2.286000000000058,"y":-1.9048729999999523},{"x":-1.7780000000001337,"y":-1.9048729999999523}]} />
<silkscreentext text="{NAME}" pcbX="-0.1016mm" pcbY="2.727454mm" anchorAlignment="center" fontSize="1mm" />
<fabricationnotepath route={[{"x":-1.4860777999999755,"y":-0.42781219999994846},{"x":-1.450085999999942,"y":-0.42781219999994846},{"x":-1.450085999999942,"y":-1.0038079999999354},{"x":-1.4860777999999755,"y":-1.0038079999999354},{"x":-1.4860777999999755,"y":-0.42781219999994846}]} strokeWidth="0.254mm" />
<fabricationnotepath route={[{"x":-1.522069600000009,"y":-0.42781219999994846},{"x":-1.4860777999999755,"y":-0.42781219999994846},{"x":-1.4860777999999755,"y":-1.0038079999999354},{"x":-1.522069600000009,"y":-1.0038079999999354},{"x":-1.522069600000009,"y":-0.42781219999994846}]} strokeWidth="0.254mm" />
<fabricationnotepath route={[{"x":-1.5580867999999555,"y":-0.42781219999994846},{"x":-1.522069600000009,"y":-0.42781219999994846},{"x":-1.522069600000009,"y":-1.0038079999999354},{"x":-1.5580867999999555,"y":-1.0038079999999354},{"x":-1.5580867999999555,"y":-0.42781219999994846}]} strokeWidth="0.254mm" />
<fabricationnotepath route={[{"x":-1.594078599999989,"y":-0.4638039999999819},{"x":-1.5580867999999555,"y":-0.4638039999999819},{"x":-1.5580867999999555,"y":-1.0038079999999354},{"x":-1.594078599999989,"y":-1.0038079999999354},{"x":-1.594078599999989,"y":-0.4638039999999819}]} strokeWidth="0.254mm" />
<fabricationnotepath route={[{"x":-1.6300704000000223,"y":-0.4638039999999819},{"x":-1.594078599999989,"y":-0.4638039999999819},{"x":-1.594078599999989,"y":-0.5718047999998817},{"x":-1.6300704000000223,"y":-0.5718047999998817},{"x":-1.6300704000000223,"y":-0.4638039999999819}]} strokeWidth="0.254mm" />
<fabricationnotepath route={[{"x":-1.666087599999969,"y":-0.49979579999990165},{"x":-1.6300704000000223,"y":-0.49979579999990165},{"x":-1.6300704000000223,"y":-0.6077965999999151},{"x":-1.666087599999969,"y":-0.6077965999999151},{"x":-1.666087599999969,"y":-0.49979579999990165}]} strokeWidth="0.254mm" />
<fabricationnotepath route={[{"x":-1.7020794000000024,"y":-0.5358129999998482},{"x":-1.666087599999969,"y":-0.5358129999998482},{"x":-1.666087599999969,"y":-0.6077965999999151},{"x":-1.7020794000000024,"y":-0.6077965999999151},{"x":-1.7020794000000024,"y":-0.5358129999998482}]} strokeWidth="0.254mm" />
<fabricationnotepath route={[{"x":-1.7380712000000358,"y":-0.5358129999998482},{"x":-1.7020794000000024,"y":-0.5358129999998482},{"x":-1.7020794000000024,"y":-0.6077965999999151},{"x":-1.7380712000000358,"y":-0.6077965999999151},{"x":-1.7380712000000358,"y":-0.5358129999998482}]} strokeWidth="0.254mm" />
<fabricationnotepath route={[{"x":-1.2065000000000055,"y":1.2065000000000055},{"x":-1.2065000000000055,"y":0.5715000000000146},{"x":-1.0795000000000528,"y":0.5715000000000146},{"x":-1.0795000000000528,"y":1.2065000000000055},{"x":-1.2065000000000055,"y":1.2065000000000055}]} strokeWidth="0.254mm" />
<fabricationnotepath route={[{"x":-1.4677136000000246,"y":0.8197595999999976},{"x":-0.8327136000000337,"y":0.8197595999999976},{"x":-0.8327136000000337,"y":0.946759600000064},{"x":-1.4677136000000246,"y":0.946759600000064},{"x":-1.4677136000000246,"y":0.8197595999999976}]} strokeWidth="0.254mm" />
<courtyardoutline outline={[{"x":-2.536000000000058,"y":1.9774540000000798},{"x":2.3327999999999065,"y":1.9774540000000798},{"x":2.3327999999999065,"y":-2.154745999999932},{"x":-2.536000000000058,"y":-2.154745999999932},{"x":-2.536000000000058,"y":1.9774540000000798}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C271629.obj?uuid=3d8e5f33629249f9a4089449c02742d4",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C271629.step?uuid=3d8e5f33629249f9a4089449c02742d4",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: -0.01 },
      }}
      {...props}
    />
  )
}