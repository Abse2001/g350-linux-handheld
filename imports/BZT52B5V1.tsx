import type { DiodeProps } from "@tscircuit/props"

export const BZT52B5V1 = (props: DiodeProps) => {
  const { name = "D1", ...restProps } = props

  return (
    <diode
      name={name}
      // Shikues REV.08.1: physical pin1 is cathode, pin2 is anode.
      pinLabels={{pin1:["cathode","neg"],pin2:["anode","pos"]}}
      variant="zener"
      supplierPartNumbers={{
  "jlcpcb": [
    "C475656"
  ]
}}
      manufacturerPartNumber="BZT52B5V1"
      footprint={<footprint>
        <smtpad portHints={["pin2"]} pcbX="1.6350996mm" pcbY="0mm" width="0.9100058mm" height="1.2199874mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-1.6350996mm" pcbY="0mm" width="0.9100058mm" height="1.2199874mm" shape="rect" />
<silkscreenpath route={[{"x":-1.37619739999991,"y":0.9262109999999666},{"x":1.3761974000000237,"y":0.9262109999999666}]} />
<silkscreenpath route={[{"x":1.3761974000000237,"y":0.9262109999999666},{"x":1.3761974000000237,"y":0.6832091999999648}]} />
<silkscreenpath route={[{"x":-1.37619739999991,"y":-0.9262109999999666},{"x":1.3761974000000237,"y":-0.9262109999999666}]} />
<silkscreenpath route={[{"x":1.3761974000000237,"y":-0.9262109999999666},{"x":1.3761974000000237,"y":-0.6832091999999648}]} />
<silkscreenpath route={[{"x":-0.9668002000000797,"y":0.9262109999999666},{"x":-0.9668002000000797,"y":-0.9262109999999666}]} />
<silkscreentext text="{NAME}" pcbX="0.0127mm" pcbY="1.9906mm" anchorAlignment="center" fontSize="1mm" />
<fabricationnotepath route={[{"x":-1.096010000000092,"y":0.10200640000016392},{"x":-1.096010000000092,"y":-0.10200640000005023},{"x":-0.2800096000001986,"y":-0.10200640000005023},{"x":-0.2800096000001986,"y":0.10200640000016392},{"x":-1.096010000000092,"y":0.10200640000016392}]} strokeWidth="0.254mm" />
<fabricationnotepath route={[{"x":1.0960099999999784,"y":0.10200640000016392},{"x":1.0960099999999784,"y":-0.10200640000005023},{"x":0.2800096000000849,"y":-0.10200640000005023},{"x":0.2800096000000849,"y":0.10200640000016392},{"x":1.0960099999999784,"y":0.10200640000016392}]} strokeWidth="0.254mm" />
<fabricationnotepath route={[{"x":0.7899907999999414,"y":0.680008799999996},{"x":0.7899907999999414,"y":-0.680008799999996},{"x":0.5860033999998677,"y":-0.680008799999996},{"x":0.5860033999998677,"y":0.680008799999996},{"x":0.7899907999999414,"y":0.680008799999996}]} strokeWidth="0.254mm" />
<courtyardoutline outline={[{"x":-2.3401024999999436,"y":1.0499984000000495},{"x":2.34010249999983,"y":1.0499984000000495},{"x":2.34010249999983,"y":-1.0499984000000495},{"x":-2.3401024999999436,"y":-1.0499984000000495},{"x":-2.3401024999999436,"y":1.0499984000000495}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C475656.obj?uuid=4d7f235d12124480ae44c354a7fd93dd",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C475656.step?uuid=4d7f235d12124480ae44c354a7fd93dd",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: 0.000012699999956566899, y: 0, z: 0.025856 },
      }}
      {...restProps}
    />
  )
}
