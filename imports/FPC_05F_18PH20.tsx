import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin6"],
  pin7: ["pin7"],
  pin8: ["pin8"],
  pin9: ["pin9"],
  pin10: ["pin10"],
  pin11: ["pin11"],
  pin12: ["pin12"],
  pin13: ["pin13"],
  pin14: ["pin14"],
  pin15: ["pin15"],
  pin16: ["pin16"],
  pin17: ["pin17"],
  pin18: ["pin18"],
  pin19: ["pin19"],
  pin20: ["pin20"]
} as const

export const FPC_05F_18PH20 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2856802"
  ]
}}
      manufacturerPartNumber="FPC-05F-18PH20"
      footprint={<footprint insertionDirection="from_y_neg">
        <smtpad portHints={["pin12"]} pcbX="1.2499086mm" pcbY="1.6000222mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin11"]} pcbX="0.7500366mm" pcbY="1.6000222mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin10"]} pcbX="0.2499106mm" pcbY="1.6000222mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin9"]} pcbX="-0.2499614mm" pcbY="1.6000222mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="-0.7500874mm" pcbY="1.6000222mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="-1.2499594mm" pcbY="1.6000222mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="-1.7500854mm" pcbY="1.6000222mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="-2.2499574mm" pcbY="1.6000222mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-2.7500834mm" pcbY="1.6000222mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="-3.2499554mm" pcbY="1.6000222mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-3.7500814mm" pcbY="1.6000222mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-4.2499534mm" pcbY="1.6000222mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin13"]} pcbX="1.749806mm" pcbY="1.5999714mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin14"]} pcbX="2.249932mm" pcbY="1.5999714mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin15"]} pcbX="2.749804mm" pcbY="1.5999714mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin16"]} pcbX="3.24993mm" pcbY="1.5999714mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin17"]} pcbX="3.749802mm" pcbY="1.5999714mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin18"]} pcbX="4.249928mm" pcbY="1.5999714mm" width="0.2999994mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin19"]} pcbX="-5.9399932mm" pcbY="-0.9750298mm" width="1.999996mm" height="2.499995mm" shape="rect" />
<smtpad portHints={["pin20"]} pcbX="5.9399932mm" pcbY="-0.9400032mm" width="1.999996mm" height="2.499995mm" shape="rect" />
<silkscreenpath route={[{"x":-6.769989000000123,"y":0.5061203999998725},{"x":-6.769989000000123,"y":1.3324840000000222},{"x":-4.631131200000027,"y":1.3324840000000222}]} />
<silkscreenpath route={[{"x":6.669989200000032,"y":-2.42115339999998},{"x":6.669989200000032,"y":-3.9074851999999964},{"x":-6.769989000000123,"y":-3.9074851999999964},{"x":-6.769989000000123,"y":-2.4561800000000176}]} />
<silkscreenpath route={[{"x":4.529988399999979,"y":1.3324840000000222},{"x":6.669989200000032,"y":1.3324840000000222},{"x":6.669989200000032,"y":0.5411470000000236}]} />
<silkscreencircle pcbX="-4.8270414mm" pcbY="1.9634962mm" radius="0.127mm" />
<silkscreencircle pcbX="-4.8270414mm" pcbY="1.9634962mm" radius="0.127mm" />
<silkscreentext text="{NAME}" pcbX="-0.0081534mm" pcbY="3.2350222mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-7.1923534000001155,"y":2.485022200000003},{"x":7.176046599999836,"y":2.485022200000003},{"x":7.176046599999836,"y":-4.136377799999991},{"x":-7.1923534000001155,"y":-4.136377799999991},{"x":-7.1923534000001155,"y":2.485022200000003}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2856802.obj?uuid=2ed562e7949849e5816086de9fca469b",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2856802.step?uuid=2ed562e7949849e5816086de9fca469b",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.00005079999993995443, y: -1.2974985999998672, z: 0 },
      }}
      {...props}
    />
  )
}