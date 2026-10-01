import type { InductorProps } from "@tscircuit/props"

export const WPN252012E1R0MT = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="1uH"
      supplierPartNumbers={{
  "jlcpcb": [
    "C370610"
  ]
}}
      manufacturerPartNumber="WPN252012E1R0MT"
      footprint={<footprint>
        <smtpad portHints={["pin2"]} pcbX="0.950468mm" pcbY="0mm" width="0.999998mm" height="2.1999956mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-0.950468mm" pcbY="0mm" width="0.999998mm" height="2.1999956mm" shape="rect" />
<silkscreenpath route={[{"x":-1.2445237999999108,"y":1.3209016000000702},{"x":1.255496600000015,"y":1.3209016000000702}]} />
<silkscreenpath route={[{"x":-1.2445237999999108,"y":-1.2952983999999788},{"x":1.255496600000015,"y":-1.2952983999999788}]} />
<silkscreentext text="{NAME}" pcbX="-0.003302mm" pcbY="2.327404mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-1.7011019999999917,"y":1.577404000000115},{"x":1.694498000000067,"y":1.577404000000115},{"x":1.694498000000067,"y":-1.5387959999999339},{"x":-1.7011019999999917,"y":-1.5387959999999339},{"x":-1.7011019999999917,"y":1.577404000000115}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C370610.obj?uuid=ad5e75685c10499c98bee356614f63c6",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C370610.step?uuid=ad5e75685c10499c98bee356614f63c6",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: -0.0001015999999935957, y: 0.0000762000000804619, z: -0.025 },
      }}
      {...props}
    />
  )
}