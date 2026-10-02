import type { ChipProps } from "@tscircuit/props"

// tsci JLCPCB C444917 import. Signal and mounting/contact aliases corrected
// against SOFNG TF-013 manufacturer drawing, page 2. Copper is unchanged.
// Import pin11 is the side card-detect contact, not a grounded mounting tab;
// pin10 and pin14 are the upper shell tabs. Verify switch behavior at bring-up.
const pinLabels = {
  pin1: ["DAT2"],
  pin2: ["DAT3", "CD_DAT3"],
  pin3: ["CMD"],
  pin4: ["VDD"],
  pin5: ["CLK", "CLX"],
  pin6: ["VSS"],
  pin7: ["DAT0"],
  pin8: ["DAT1"],
  pin9: ["DETECT1"],
  pin10: ["GND4"],
  pin11: ["DETECT2"],
  pin12: ["GND1"],
  pin13: ["GND3"],
  pin14: ["GND2"]
} as const

const pinAttributes = {
  pin4: {requiresPower: true},
  pin6: {requiresGround: true},
  pin10: {requiresGround: true},
  pin12: {requiresGround: true},
  pin13: {requiresGround: true},
  pin14: {requiresGround: true}
} as const

export const TF_013 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C444917"
  ]
}}
      manufacturerPartNumber="TF-013"
      footprint={<footprint>
        <smtpad portHints={["pin14"]} pcbX="4.350131mm" pcbY="7.72502265mm" width="0.999998mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="2.799969mm" pcbY="7.72502265mm" width="0.7999984mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="0.600075mm" pcbY="7.72502265mm" width="0.7999984mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="1.700149mm" pcbY="7.72502265mm" width="0.7999984mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-0.499745mm" pcbY="7.72502265mm" width="0.7999984mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="-1.599819mm" pcbY="7.72502265mm" width="0.7999984mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="-3.809873mm" pcbY="7.72502265mm" width="0.7999984mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="-4.899787mm" pcbY="7.72502265mm" width="0.6999986mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="-2.699893mm" pcbY="7.72502265mm" width="0.7999984mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin12"]} pcbX="-6.849999mm" pcbY="-6.92493535mm" width="0.999998mm" height="2.7999944mm" shape="rect" />
<smtpad portHints={["pin11"]} pcbX="-6.849999mm" pcbY="-2.77508335mm" width="0.999998mm" height="0.7999984mm" shape="rect" />
<smtpad portHints={["pin10"]} pcbX="-6.849999mm" pcbY="3.42505665mm" width="0.999998mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin13"]} pcbX="6.849999mm" pcbY="-7.37502335mm" width="0.999998mm" height="1.8999962mm" shape="rect" />
<smtpad portHints={["pin9"]} pcbX="-5.850001mm" pcbY="7.72502265mm" width="0.6999986mm" height="1.1999976mm" shape="rect" />
<silkscreenpath route={[{"x":7.11210159999996,"y":-6.174974949999978},{"x":7.11210159999996,"y":8.10602265},{"x":5.081219200000078,"y":8.10602265}]} />
<silkscreenpath route={[{"x":-5.1280567999999676,"y":-7.8959773500000665},{"x":-5.1280567999999676,"y":-6.936974949999922}]} />
<silkscreenpath route={[{"x":-6.98489840000002,"y":-3.406120949999945},{"x":-6.98489840000002,"y":-5.293848949999983}]} />
<silkscreenpath route={[{"x":-6.98489840000002,"y":2.593892450000112},{"x":-6.98489840000002,"y":-2.1438425499998175}]} />
<silkscreenpath route={[{"x":-6.48106400000006,"y":8.10602265},{"x":-6.98489840000002,"y":8.10602265},{"x":-6.98489840000002,"y":4.256170050000037}]} />
<silkscreenpath route={[{"x":3.6189411999999948,"y":8.10602265},{"x":3.4312097999999196,"y":8.10602265}]} />
<silkscreenpath route={[{"x":-6.118758399999933,"y":-7.8959773500000665},{"x":6.118961600000034,"y":-7.8959773500000665}]} />
<silkscreenpath route={[{"x":5.142636399999901,"y":-7.895977349999839},{"x":4.901049356141584,"y":-7.818478371649007},{"x":4.65863486261685,"y":-7.743607785068889},{"x":4.4154215145824764,"y":-7.6713744219763385},{"x":4.171438001428214,"y":-7.601786803002028},{"x":3.926713103391535,"y":-7.534853136684774},{"x":3.6812756881643054,"y":-7.4705813185045145},{"x":3.4351547074858217,"y":-7.408978929949626},{"x":3.1883791937298156,"y":-7.350053237623342},{"x":2.940978256477706,"y":-7.293811192386784},{"x":2.692981079085712,"y":-7.240259428538138},{"x":2.4444169152428685,"y":-7.189404263030951},{"x":2.195315085519269,"y":-7.14125169472868},{"x":1.945704973908505,"y":-7.095807403696767},{"x":1.6956160243607883,"y":-7.053076750533137},{"x":1.4450777373097026,"y":-7.013064775735984},{"x":1.1941196661927052,"y":-6.975776199108054},{"x":0.9427714139650334,"y":-6.941215419201171},{"x":0.6910626296073588,"y":-6.9093865127968},{"x":0.43902300462889343,"y":-6.880293234425494},{"x":0.18668226956447143,"y":-6.853939015923174},{"x":-0.06592980953189453,"y":-6.830326966027542},{"x":-0.31878343459879943,"y":-6.809459870010414},{"x":-0.5718487790820745,"y":-6.791340189349285},{"x":-0.825095991453054,"y":-6.775970061437874},{"x":-1.0784951987301383,"y":-6.7633512993324985},{"x":-1.3320165100021768,"y":-6.753485391539584},{"x":-1.5856300199550333,"y":-6.746373501839116},{"x":-1.8393058123983792,"y":-6.742016469147984},{"x":-2.0930139637957836,"y":-6.740414807420848},{"x":-2.346724546792757,"y":-6.741568705589316},{"x":-2.600407633748773,"y":-6.7454780275396615},{"x":-2.8540333002666785,"y":-6.752142312129536},{"x":-3.1075716287220985,"y":-6.761560773241058},{"x":-3.3609927117935285,"y":-6.773732299875064},{"x":-3.614266655989468,"y":-6.7886554562811625},{"x":-3.867363585174985,"y":-6.806328482126901},{"x":-4.120253644095783,"y":-6.826749292706836},{"x":-4.372907001899762,"y":-6.849915479186848},{"x":-4.625293855656423,"y":-6.875824308888696},{"x":-4.877384433871612,"y":-6.904472725613232},{"x":-5.129148999999984,"y":-6.935857349999651}]} />
<silkscreencircle pcbX="3.429127mm" pcbY="8.61402265mm" radius="0.127mm" />
<silkscreentext text="{NAME}" pcbX="0.004191mm" pcbY="9.74102265mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-7.599108999999999,"y":8.991022650000104},{"x":7.6074910000000955,"y":8.991022650000104},{"x":7.6074910000000955,"y":-8.577777349999906},{"x":-7.599108999999999,"y":-8.577777349999906},{"x":-7.599108999999999,"y":8.991022650000104}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C444917.obj?uuid=3c1d3542071f4699a6407a5a1043aade",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C444917.step?uuid=3c1d3542071f4699a6407a5a1043aade",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.07501254999999674, z: -1.7 },
      }}
      {...props}
    />
  )
}
