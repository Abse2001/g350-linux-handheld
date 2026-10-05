import type { InductorProps } from "@tscircuit/props"

export const VLCF5020T_100M1R1_1 = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="10uH"
      supplierPartNumbers={{
  "jlcpcb": [
    "C89448"
  ]
}}
      manufacturerPartNumber="VLCF5020T-100M1R1-1"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-1.7034002mm" pcbY="0mm" width="2.1999956mm" height="5.2999894mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="1.7034002mm" pcbY="0mm" width="2.1999956mm" height="5.2999894mm" shape="rect" />
<silkscreenpath route={[{"x":-2.8399994000000106,"y":2.9399992000000026},{"x":3.0399989999999804,"y":2.9399992000000026},{"x":3.0399989999999804,"y":-2.7299919999999958},{"x":3.0399989999999804,"y":-2.8399993999999964},{"x":-3.0299914,"y":-2.8399993999999964},{"x":-3.0299914,"y":2.949981400000013},{"x":-2.5499822000000023,"y":2.949981400000013}]} />
<silkscreentext text="{NAME}" pcbX="0.0127mm" pcbY="3.9464mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-3.0533980000000014,"y":2.8999946999999935},{"x":3.053397999999987,"y":2.8999946999999935},{"x":3.053397999999987,"y":-2.8999946999999935},{"x":-3.0533980000000014,"y":-2.8999946999999935},{"x":-3.0533980000000014,"y":2.8999946999999935}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C89448.obj?uuid=1e6462a2fb334513b798a667703fbcd8",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C89448.step?uuid=1e6462a2fb334513b798a667703fbcd8",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: -0.00002540000001260978, y: 0.000012699999984988608, z: -0.4 },
      }}
      {...props}
    />
  )
}