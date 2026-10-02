import { type ChipProps } from "tscircuit"
const pinLabels = {
  "pin1": [
    "1A1"
  ],
  "pin2": [
    "1A2"
  ],
  "pin3": [
    "1A3"
  ],
  "pin4": [
    "1A4"
  ],
  "pin5": [
    "1A5"
  ],
  "pin6": [
    "1A6"
  ],
  "pin7": [
    "1A7"
  ],
  "pin8": [
    "1A8"
  ],
  "pin9": [
    "1A9"
  ],
  "pin10": [
    "1A10"
  ],
  "pin11": [
    "1A11"
  ],
  "pin12": [
    "1A13"
  ],
  "pin13": [
    "1A14"
  ],
  "pin14": [
    "1A15"
  ],
  "pin15": [
    "1A16"
  ],
  "pin16": [
    "1A17"
  ],
  "pin17": [
    "1A18"
  ],
  "pin18": [
    "1A19"
  ],
  "pin19": [
    "1A20"
  ],
  "pin20": [
    "1B1"
  ],
  "pin21": [
    "1B3"
  ],
  "pin22": [
    "1B5"
  ],
  "pin23": [
    "1B7"
  ],
  "pin24": [
    "1B8"
  ],
  "pin25": [
    "1B9"
  ],
  "pin26": [
    "1B10"
  ],
  "pin27": [
    "1B11"
  ],
  "pin28": [
    "1B13"
  ],
  "pin29": [
    "1B14"
  ],
  "pin30": [
    "1B15"
  ],
  "pin31": [
    "1B16"
  ],
  "pin32": [
    "1B17"
  ],
  "pin33": [
    "1B18"
  ],
  "pin34": [
    "1B19"
  ],
  "pin35": [
    "1B20"
  ],
  "pin36": [
    "1C1"
  ],
  "pin37": [
    "1C2"
  ],
  "pin38": [
    "1C3"
  ],
  "pin39": [
    "1C4"
  ],
  "pin40": [
    "1C5"
  ],
  "pin41": [
    "1C6"
  ],
  "pin42": [
    "1C7"
  ],
  "pin43": [
    "1C8"
  ],
  "pin44": [
    "1C9"
  ],
  "pin45": [
    "1C10"
  ],
  "pin46": [
    "1C12"
  ],
  "pin47": [
    "1C13"
  ],
  "pin48": [
    "1C14"
  ],
  "pin49": [
    "1C15"
  ],
  "pin50": [
    "1C16"
  ],
  "pin51": [
    "1C17"
  ],
  "pin52": [
    "1C18"
  ],
  "pin53": [
    "1C19"
  ],
  "pin54": [
    "1C20"
  ],
  "pin55": [
    "1D1"
  ],
  "pin56": [
    "1D2"
  ],
  "pin57": [
    "1D3"
  ],
  "pin58": [
    "1D4"
  ],
  "pin59": [
    "1D5"
  ],
  "pin60": [
    "1D6"
  ],
  "pin61": [
    "1D7"
  ],
  "pin62": [
    "1D8"
  ],
  "pin63": [
    "1D11"
  ],
  "pin64": [
    "1D12"
  ],
  "pin65": [
    "1D13"
  ],
  "pin66": [
    "1D14"
  ],
  "pin67": [
    "1D15"
  ],
  "pin68": [
    "1D16"
  ],
  "pin69": [
    "1D17"
  ],
  "pin70": [
    "1D18"
  ],
  "pin71": [
    "1D19"
  ],
  "pin72": [
    "1D20"
  ],
  "pin73": [
    "1E1"
  ],
  "pin74": [
    "1E2"
  ],
  "pin75": [
    "1E3"
  ],
  "pin76": [
    "1E4"
  ],
  "pin77": [
    "1E6"
  ],
  "pin78": [
    "1E7"
  ],
  "pin79": [
    "1E8"
  ],
  "pin80": [
    "1E9"
  ],
  "pin81": [
    "1E12"
  ],
  "pin82": [
    "1E13"
  ],
  "pin83": [
    "1E14"
  ],
  "pin84": [
    "1E15"
  ],
  "pin85": [
    "1E16"
  ],
  "pin86": [
    "1E17"
  ],
  "pin87": [
    "1E18"
  ],
  "pin88": [
    "1E19"
  ],
  "pin89": [
    "1E20"
  ],
  "pin90": [
    "1F2"
  ],
  "pin91": [
    "1F3"
  ],
  "pin92": [
    "1F4"
  ],
  "pin93": [
    "1F5"
  ],
  "pin94": [
    "1F6"
  ],
  "pin95": [
    "1F7"
  ],
  "pin96": [
    "1F8"
  ],
  "pin97": [
    "1F9"
  ],
  "pin98": [
    "1F10"
  ],
  "pin99": [
    "1F11"
  ],
  "pin100": [
    "1F12"
  ],
  "pin101": [
    "1F13"
  ],
  "pin102": [
    "1F14"
  ],
  "pin103": [
    "1F15"
  ],
  "pin104": [
    "1F16"
  ],
  "pin105": [
    "1F17"
  ],
  "pin106": [
    "1F19"
  ],
  "pin107": [
    "1F20"
  ],
  "pin108": [
    "1F18"
  ],
  "pin109": [
    "1B6"
  ],
  "pin110": [
    "1D10"
  ],
  "pin111": [
    "1D9"
  ],
  "pin112": [
    "1E10"
  ],
  "pin113": [
    "1E11"
  ],
  "pin114": [
    "1F1"
  ],
  "pin115": [
    "1L1"
  ],
  "pin116": [
    "1L2"
  ],
  "pin117": [
    "1L3"
  ],
  "pin118": [
    "1L4"
  ],
  "pin119": [
    "1L5"
  ],
  "pin120": [
    "1L6"
  ],
  "pin121": [
    "1L7"
  ],
  "pin122": [
    "1L8"
  ],
  "pin123": [
    "1L9"
  ],
  "pin124": [
    "1L10"
  ],
  "pin125": [
    "1L11"
  ],
  "pin126": [
    "1L12"
  ],
  "pin127": [
    "1L13"
  ],
  "pin128": [
    "1L15"
  ],
  "pin129": [
    "1L19"
  ],
  "pin130": [
    "1L14"
  ],
  "pin131": [
    "1K2"
  ],
  "pin132": [
    "1K3"
  ],
  "pin133": [
    "1K4"
  ],
  "pin134": [
    "1K5"
  ],
  "pin135": [
    "1K6"
  ],
  "pin136": [
    "1K7"
  ],
  "pin137": [
    "1K8"
  ],
  "pin138": [
    "1K9"
  ],
  "pin139": [
    "1K10"
  ],
  "pin140": [
    "1K11"
  ],
  "pin141": [
    "1K12"
  ],
  "pin142": [
    "1K13"
  ],
  "pin143": [
    "1K14"
  ],
  "pin144": [
    "1K15"
  ],
  "pin145": [
    "1K16"
  ],
  "pin146": [
    "1K17"
  ],
  "pin147": [
    "1K18"
  ],
  "pin148": [
    "1K19"
  ],
  "pin149": [
    "1K20"
  ],
  "pin150": [
    "1M3"
  ],
  "pin151": [
    "1M4"
  ],
  "pin152": [
    "1M5"
  ],
  "pin153": [
    "1M6"
  ],
  "pin154": [
    "1M7"
  ],
  "pin155": [
    "1M8"
  ],
  "pin156": [
    "1M9"
  ],
  "pin157": [
    "1M10"
  ],
  "pin158": [
    "1M12"
  ],
  "pin159": [
    "1M13"
  ],
  "pin160": [
    "1M14"
  ],
  "pin161": [
    "1M15"
  ],
  "pin162": [
    "1M16"
  ],
  "pin163": [
    "1M17"
  ],
  "pin164": [
    "1M18"
  ],
  "pin165": [
    "1M19"
  ],
  "pin166": [
    "1M20"
  ],
  "pin167": [
    "1U1"
  ],
  "pin168": [
    "1U2"
  ],
  "pin169": [
    "1U3"
  ],
  "pin170": [
    "1U4"
  ],
  "pin171": [
    "1U5"
  ],
  "pin172": [
    "1U6"
  ],
  "pin173": [
    "1U7"
  ],
  "pin174": [
    "1U8"
  ],
  "pin175": [
    "1U9"
  ],
  "pin176": [
    "1U11"
  ],
  "pin177": [
    "1U12"
  ],
  "pin178": [
    "1U13"
  ],
  "pin179": [
    "1U15"
  ],
  "pin180": [
    "1U16"
  ],
  "pin181": [
    "1U17"
  ],
  "pin182": [
    "1U18"
  ],
  "pin183": [
    "1U19"
  ],
  "pin184": [
    "1U20"
  ],
  "pin185": [
    "1V1"
  ],
  "pin186": [
    "1V2"
  ],
  "pin187": [
    "1V3"
  ],
  "pin188": [
    "1V4"
  ],
  "pin189": [
    "1V5"
  ],
  "pin190": [
    "1V6"
  ],
  "pin191": [
    "1V7"
  ],
  "pin192": [
    "1V8"
  ],
  "pin193": [
    "1V9"
  ],
  "pin194": [
    "1V11"
  ],
  "pin195": [
    "1V12"
  ],
  "pin196": [
    "1V13"
  ],
  "pin197": [
    "1V15"
  ],
  "pin198": [
    "1V16"
  ],
  "pin199": [
    "1V17"
  ],
  "pin200": [
    "1V18"
  ],
  "pin201": [
    "1V19"
  ],
  "pin202": [
    "1V20"
  ],
  "pin203": [
    "1M11"
  ],
  "pin204": [
    "A1"
  ],
  "pin205": [
    "A2"
  ],
  "pin206": [
    "A3"
  ],
  "pin207": [
    "A5"
  ],
  "pin208": [
    "A7"
  ],
  "pin209": [
    "A9"
  ],
  "pin210": [
    "A10"
  ],
  "pin211": [
    "A12"
  ],
  "pin212": [
    "A13"
  ],
  "pin213": [
    "A15"
  ],
  "pin214": [
    "A17"
  ],
  "pin215": [
    "A19"
  ],
  "pin216": [
    "A20"
  ],
  "pin217": [
    "A22"
  ],
  "pin218": [
    "A23"
  ],
  "pin219": [
    "A26"
  ],
  "pin220": [
    "A27"
  ],
  "pin221": [
    "A29"
  ],
  "pin222": [
    "A30"
  ],
  "pin223": [
    "A32"
  ],
  "pin224": [
    "A33"
  ],
  "pin225": [
    "A35"
  ],
  "pin226": [
    "A37"
  ],
  "pin227": [
    "A38"
  ],
  "pin228": [
    "B1"
  ],
  "pin229": [
    "B2"
  ],
  "pin230": [
    "B3"
  ],
  "pin231": [
    "B4"
  ],
  "pin232": [
    "B5"
  ],
  "pin233": [
    "B6"
  ],
  "pin234": [
    "B7"
  ],
  "pin235": [
    "B8"
  ],
  "pin236": [
    "B9"
  ],
  "pin237": [
    "B10"
  ],
  "pin238": [
    "B11"
  ],
  "pin239": [
    "B12"
  ],
  "pin240": [
    "B13"
  ],
  "pin241": [
    "B14"
  ],
  "pin242": [
    "B15"
  ],
  "pin243": [
    "B16"
  ],
  "pin244": [
    "B17"
  ],
  "pin245": [
    "B18"
  ],
  "pin246": [
    "B19"
  ],
  "pin247": [
    "B20"
  ],
  "pin248": [
    "B21"
  ],
  "pin249": [
    "B22"
  ],
  "pin250": [
    "B23"
  ],
  "pin251": [
    "B24"
  ],
  "pin252": [
    "B25"
  ],
  "pin253": [
    "B26"
  ],
  "pin254": [
    "B27"
  ],
  "pin255": [
    "B28"
  ],
  "pin256": [
    "B29"
  ],
  "pin257": [
    "B30"
  ],
  "pin258": [
    "B31"
  ],
  "pin259": [
    "B32"
  ],
  "pin260": [
    "B33"
  ],
  "pin261": [
    "B34"
  ],
  "pin262": [
    "B35"
  ],
  "pin263": [
    "B36"
  ],
  "pin264": [
    "B37"
  ],
  "pin265": [
    "B38"
  ],
  "pin266": [
    "C1"
  ],
  "pin267": [
    "C2"
  ],
  "pin268": [
    "C37"
  ],
  "pin269": [
    "D2"
  ],
  "pin270": [
    "D37"
  ],
  "pin271": [
    "D38"
  ],
  "pin272": [
    "E1"
  ],
  "pin273": [
    "E2"
  ],
  "pin274": [
    "E37"
  ],
  "pin275": [
    "F1"
  ],
  "pin276": [
    "F2"
  ],
  "pin277": [
    "F37"
  ],
  "pin278": [
    "F38"
  ],
  "pin279": [
    "G2"
  ],
  "pin280": [
    "G37"
  ],
  "pin281": [
    "G38"
  ],
  "pin282": [
    "H1"
  ],
  "pin283": [
    "H2"
  ],
  "pin284": [
    "H37"
  ],
  "pin285": [
    "J2"
  ],
  "pin286": [
    "J37"
  ],
  "pin287": [
    "J38"
  ],
  "pin288": [
    "K1"
  ],
  "pin289": [
    "K2"
  ],
  "pin290": [
    "K37"
  ],
  "pin291": [
    "K38"
  ],
  "pin292": [
    "L2"
  ],
  "pin293": [
    "L37"
  ],
  "pin294": [
    "M1"
  ],
  "pin295": [
    "M2"
  ],
  "pin296": [
    "M37"
  ],
  "pin297": [
    "M38"
  ],
  "pin298": [
    "N1"
  ],
  "pin299": [
    "N2"
  ],
  "pin300": [
    "N37"
  ],
  "pin301": [
    "N38"
  ],
  "pin302": [
    "P2"
  ],
  "pin303": [
    "P37"
  ],
  "pin304": [
    "R1"
  ],
  "pin305": [
    "R2"
  ],
  "pin306": [
    "R37"
  ],
  "pin307": [
    "R38"
  ],
  "pin308": [
    "T2"
  ],
  "pin309": [
    "T37"
  ],
  "pin310": [
    "T38"
  ],
  "pin311": [
    "U2"
  ],
  "pin312": [
    "U37"
  ],
  "pin313": [
    "V1"
  ],
  "pin314": [
    "V2"
  ],
  "pin315": [
    "V37"
  ],
  "pin316": [
    "V38"
  ],
  "pin317": [
    "W2"
  ],
  "pin318": [
    "W37"
  ],
  "pin319": [
    "W38"
  ],
  "pin320": [
    "Y1"
  ],
  "pin321": [
    "Y2"
  ],
  "pin322": [
    "Y37"
  ],
  "pin323": [
    "AA2"
  ],
  "pin324": [
    "AA37"
  ],
  "pin325": [
    "AA38"
  ],
  "pin326": [
    "AB1"
  ],
  "pin327": [
    "AB2"
  ],
  "pin328": [
    "AB37"
  ],
  "pin329": [
    "AB38"
  ],
  "pin330": [
    "AC2"
  ],
  "pin331": [
    "AC37"
  ],
  "pin332": [
    "AD1"
  ],
  "pin333": [
    "AD2"
  ],
  "pin334": [
    "AD37"
  ],
  "pin335": [
    "AD38"
  ],
  "pin336": [
    "AE2"
  ],
  "pin337": [
    "AE37"
  ],
  "pin338": [
    "AF1"
  ],
  "pin339": [
    "AF2"
  ],
  "pin340": [
    "AF37"
  ],
  "pin341": [
    "AF38"
  ],
  "pin342": [
    "AG2"
  ],
  "pin343": [
    "AG37"
  ],
  "pin344": [
    "AG38"
  ],
  "pin345": [
    "AH2"
  ],
  "pin346": [
    "AH37"
  ],
  "pin347": [
    "AJ1"
  ],
  "pin348": [
    "AJ2"
  ],
  "pin349": [
    "AJ37"
  ],
  "pin350": [
    "AJ38"
  ],
  "pin351": [
    "AK2"
  ],
  "pin352": [
    "AK37"
  ],
  "pin353": [
    "AK38"
  ],
  "pin354": [
    "AL1"
  ],
  "pin355": [
    "AL2"
  ],
  "pin356": [
    "AL37"
  ],
  "pin357": [
    "AM1"
  ],
  "pin358": [
    "AM2"
  ],
  "pin359": [
    "AM37"
  ],
  "pin360": [
    "AM38"
  ],
  "pin361": [
    "AN2"
  ],
  "pin362": [
    "AN37"
  ],
  "pin363": [
    "AN38"
  ],
  "pin364": [
    "AP1"
  ],
  "pin365": [
    "AP2"
  ],
  "pin366": [
    "AP3"
  ],
  "pin367": [
    "AP4"
  ],
  "pin368": [
    "AP5"
  ],
  "pin369": [
    "AP6"
  ],
  "pin370": [
    "AP7"
  ],
  "pin371": [
    "AP8"
  ],
  "pin372": [
    "AP9"
  ],
  "pin373": [
    "AP10"
  ],
  "pin374": [
    "AP11"
  ],
  "pin375": [
    "AP12"
  ],
  "pin376": [
    "AP13"
  ],
  "pin377": [
    "AP14"
  ],
  "pin378": [
    "AP15"
  ],
  "pin379": [
    "AP16"
  ],
  "pin380": [
    "AP17"
  ],
  "pin381": [
    "AP18"
  ],
  "pin382": [
    "AP19"
  ],
  "pin383": [
    "AP20"
  ],
  "pin384": [
    "AP21"
  ],
  "pin385": [
    "AP22"
  ],
  "pin386": [
    "AP23"
  ],
  "pin387": [
    "AP24"
  ],
  "pin388": [
    "AP25"
  ],
  "pin389": [
    "AP26"
  ],
  "pin390": [
    "AP27"
  ],
  "pin391": [
    "AP28"
  ],
  "pin392": [
    "AP29"
  ],
  "pin393": [
    "AP30"
  ],
  "pin394": [
    "AP31"
  ],
  "pin395": [
    "AP32"
  ],
  "pin396": [
    "AP33"
  ],
  "pin397": [
    "AP34"
  ],
  "pin398": [
    "AP35"
  ],
  "pin399": [
    "AP36"
  ],
  "pin400": [
    "AP37"
  ],
  "pin401": [
    "AR1"
  ],
  "pin402": [
    "AR2"
  ],
  "pin403": [
    "AR4"
  ],
  "pin404": [
    "AR6"
  ],
  "pin405": [
    "AR7"
  ],
  "pin406": [
    "AR9"
  ],
  "pin407": [
    "AR10"
  ],
  "pin408": [
    "AR12"
  ],
  "pin409": [
    "AR14"
  ],
  "pin410": [
    "AR15"
  ],
  "pin411": [
    "AR17"
  ],
  "pin412": [
    "AR18"
  ],
  "pin413": [
    "AR20"
  ],
  "pin414": [
    "AR21"
  ],
  "pin415": [
    "AR23"
  ],
  "pin416": [
    "AR24"
  ],
  "pin417": [
    "AR26"
  ],
  "pin418": [
    "AR27"
  ],
  "pin419": [
    "AR29"
  ],
  "pin420": [
    "AR30"
  ],
  "pin421": [
    "AR32"
  ],
  "pin422": [
    "AR33"
  ],
  "pin423": [
    "AR35"
  ],
  "pin424": [
    "AR36"
  ],
  "pin425": [
    "AR38"
  ],
  "pin426": [
    "1G1"
  ],
  "pin427": [
    "1G2"
  ],
  "pin428": [
    "1G3"
  ],
  "pin429": [
    "1G4"
  ],
  "pin430": [
    "1G5"
  ],
  "pin431": [
    "1G6"
  ],
  "pin432": [
    "1G7"
  ],
  "pin433": [
    "1G8"
  ],
  "pin434": [
    "1G9"
  ],
  "pin435": [
    "1G10"
  ],
  "pin436": [
    "1G11"
  ],
  "pin437": [
    "1G12"
  ],
  "pin438": [
    "1G13"
  ],
  "pin439": [
    "1G14"
  ],
  "pin440": [
    "1G15"
  ],
  "pin441": [
    "1G16"
  ],
  "pin442": [
    "1G17"
  ],
  "pin443": [
    "1G18"
  ],
  "pin444": [
    "1G19"
  ],
  "pin445": [
    "1G20"
  ],
  "pin446": [
    "1H1"
  ],
  "pin447": [
    "1H2"
  ],
  "pin448": [
    "1H3"
  ],
  "pin449": [
    "1H4"
  ],
  "pin450": [
    "1H5"
  ],
  "pin451": [
    "1H6"
  ],
  "pin452": [
    "1H7"
  ],
  "pin453": [
    "1H8"
  ],
  "pin454": [
    "1H9"
  ],
  "pin455": [
    "1H10"
  ],
  "pin456": [
    "1H11"
  ],
  "pin457": [
    "1H13"
  ],
  "pin458": [
    "1H14"
  ],
  "pin459": [
    "1H15"
  ],
  "pin460": [
    "1H16"
  ],
  "pin461": [
    "1H17"
  ],
  "pin462": [
    "1H18"
  ],
  "pin463": [
    "1H19"
  ],
  "pin464": [
    "1H20"
  ],
  "pin465": [
    "1H12"
  ],
  "pin466": [
    "1J1"
  ],
  "pin467": [
    "1J2"
  ],
  "pin468": [
    "1J3"
  ],
  "pin469": [
    "1J4"
  ],
  "pin470": [
    "1J5"
  ],
  "pin471": [
    "1J6"
  ],
  "pin472": [
    "1J7"
  ],
  "pin473": [
    "1J8"
  ],
  "pin474": [
    "1J9"
  ],
  "pin475": [
    "1J10"
  ],
  "pin476": [
    "1J11"
  ],
  "pin477": [
    "1J12"
  ],
  "pin478": [
    "1J13"
  ],
  "pin479": [
    "1J14"
  ],
  "pin480": [
    "1J15"
  ],
  "pin481": [
    "1J16"
  ],
  "pin482": [
    "1J17"
  ],
  "pin483": [
    "1J18"
  ],
  "pin484": [
    "1J19"
  ],
  "pin485": [
    "1J20"
  ],
  "pin486": [
    "1N1"
  ],
  "pin487": [
    "1N2"
  ],
  "pin488": [
    "1N3"
  ],
  "pin489": [
    "1N4"
  ],
  "pin490": [
    "1N5"
  ],
  "pin491": [
    "1N6"
  ],
  "pin492": [
    "1N7"
  ],
  "pin493": [
    "1N8"
  ],
  "pin494": [
    "1N9"
  ],
  "pin495": [
    "1N10"
  ],
  "pin496": [
    "1N11"
  ],
  "pin497": [
    "1N12"
  ],
  "pin498": [
    "1N13"
  ],
  "pin499": [
    "1N14"
  ],
  "pin500": [
    "1N15"
  ],
  "pin501": [
    "1N16"
  ],
  "pin502": [
    "1N17"
  ],
  "pin503": [
    "1N18"
  ],
  "pin504": [
    "1N19"
  ],
  "pin505": [
    "1N20"
  ],
  "pin506": [
    "1P1"
  ],
  "pin507": [
    "1P2"
  ],
  "pin508": [
    "1P3"
  ],
  "pin509": [
    "1P4"
  ],
  "pin510": [
    "1P5"
  ],
  "pin511": [
    "1P6"
  ],
  "pin512": [
    "1P7"
  ],
  "pin513": [
    "1P8"
  ],
  "pin514": [
    "1P9"
  ],
  "pin515": [
    "1P10"
  ],
  "pin516": [
    "1P11"
  ],
  "pin517": [
    "1P12"
  ],
  "pin518": [
    "1P13"
  ],
  "pin519": [
    "1P14"
  ],
  "pin520": [
    "1P15"
  ],
  "pin521": [
    "1P16"
  ],
  "pin522": [
    "1P17"
  ],
  "pin523": [
    "1P18"
  ],
  "pin524": [
    "1P19"
  ],
  "pin525": [
    "1P20"
  ],
  "pin526": [
    "1R1"
  ],
  "pin527": [
    "1R2"
  ],
  "pin528": [
    "1R3"
  ],
  "pin529": [
    "1R4"
  ],
  "pin530": [
    "1R5"
  ],
  "pin531": [
    "1R6"
  ],
  "pin532": [
    "1R7"
  ],
  "pin533": [
    "1R8"
  ],
  "pin534": [
    "1R9"
  ],
  "pin535": [
    "1R10"
  ],
  "pin536": [
    "1R11"
  ],
  "pin537": [
    "1R12"
  ],
  "pin538": [
    "1R13"
  ],
  "pin539": [
    "1R14"
  ],
  "pin540": [
    "1R15"
  ],
  "pin541": [
    "1R16"
  ],
  "pin542": [
    "1R17"
  ],
  "pin543": [
    "1R18"
  ],
  "pin544": [
    "1R19"
  ],
  "pin545": [
    "1R20"
  ],
  "pin546": [
    "1T1"
  ],
  "pin547": [
    "1T2"
  ],
  "pin548": [
    "1T3"
  ],
  "pin549": [
    "1T4"
  ],
  "pin550": [
    "1T5"
  ],
  "pin551": [
    "1T6"
  ],
  "pin552": [
    "1T7"
  ],
  "pin553": [
    "1T8"
  ],
  "pin554": [
    "1T9"
  ],
  "pin555": [
    "1T10"
  ],
  "pin556": [
    "1T11"
  ],
  "pin557": [
    "1T13"
  ],
  "pin558": [
    "1T14"
  ],
  "pin559": [
    "1T15"
  ],
  "pin560": [
    "1T16"
  ],
  "pin561": [
    "1T17"
  ],
  "pin562": [
    "1T18"
  ],
  "pin563": [
    "1T19"
  ],
  "pin564": [
    "1T20"
  ],
  "pin565": [
    "1T12"
  ]
} as const
export const RK3566 = (props: ChipProps<typeof pinLabels>) => (
  <chip
    footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-6.14514900000006mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin2"]} pcbX="-5.495162999999934mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin3"]} pcbX="-4.845177000000035mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin4"]} pcbX="-4.1951910000000225mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin5"]} pcbX="-3.5452049999998962mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin6"]} pcbX="-2.8952189999999973mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin7"]} pcbX="-2.2452330000000984mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin8"]} pcbX="-1.595246999999972mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin9"]} pcbX="-0.9452610000000732mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin10"]} pcbX="-0.2952749999999469mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin11"]} pcbX="0.35496499999999287mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin12"]} pcbX="1.654937000000018mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin13"]} pcbX="2.304922999999917mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin14"]} pcbX="2.9549090000000433mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin15"]} pcbX="3.6048949999999422mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin16"]} pcbX="4.2548810000000685mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin17"]} pcbX="4.904867000000195mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin18"]} pcbX="5.554853000000094mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin19"]} pcbX="6.20483900000022mm" pcbY="5.539993999999979mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin20"]} pcbX="-6.14514900000006mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin21"]} pcbX="-4.845177000000035mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin22"]} pcbX="-3.5452049999998962mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin23"]} pcbX="-2.2452330000000984mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin24"]} pcbX="-1.595246999999972mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin25"]} pcbX="-0.9452610000000732mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin26"]} pcbX="-0.2952749999999469mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin27"]} pcbX="0.35496499999999287mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin28"]} pcbX="1.654937000000018mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin29"]} pcbX="2.304922999999917mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin30"]} pcbX="2.9549090000000433mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin31"]} pcbX="3.6048949999999422mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin32"]} pcbX="4.2548810000000685mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin33"]} pcbX="4.904867000000195mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin34"]} pcbX="5.554853000000094mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin35"]} pcbX="6.20483900000022mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin36"]} pcbX="-6.14514900000006mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin37"]} pcbX="-5.495162999999934mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin38"]} pcbX="-4.845177000000035mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin39"]} pcbX="-4.1951910000000225mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin40"]} pcbX="-3.5452049999998962mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin41"]} pcbX="-2.8952189999999973mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin42"]} pcbX="-2.2452330000000984mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin43"]} pcbX="-1.595246999999972mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin44"]} pcbX="-0.9452610000000732mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin45"]} pcbX="-0.2952749999999469mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin46"]} pcbX="1.0049509999998918mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin47"]} pcbX="1.654937000000018mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin48"]} pcbX="2.304922999999917mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin49"]} pcbX="2.9549090000000433mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin50"]} pcbX="3.6048949999999422mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin51"]} pcbX="4.2548810000000685mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin52"]} pcbX="4.904867000000195mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin53"]} pcbX="5.554853000000094mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin54"]} pcbX="6.20483900000022mm" pcbY="4.2400219999999536mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin55"]} pcbX="-6.14514900000006mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin56"]} pcbX="-5.495162999999934mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin57"]} pcbX="-4.845177000000035mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin58"]} pcbX="-4.1951910000000225mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin59"]} pcbX="-3.5452049999998962mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin60"]} pcbX="-2.8952189999999973mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin61"]} pcbX="-2.2452330000000984mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin62"]} pcbX="-1.595246999999972mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin63"]} pcbX="0.35496499999999287mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin64"]} pcbX="1.0049509999998918mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin65"]} pcbX="1.654937000000018mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin66"]} pcbX="2.304922999999917mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin67"]} pcbX="2.9549090000000433mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin68"]} pcbX="3.6048949999999422mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin69"]} pcbX="4.2548810000000685mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin70"]} pcbX="4.904867000000195mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin71"]} pcbX="5.554853000000094mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin72"]} pcbX="6.20483900000022mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin73"]} pcbX="-6.14514900000006mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin74"]} pcbX="-5.495162999999934mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin75"]} pcbX="-4.845177000000035mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin76"]} pcbX="-4.1951910000000225mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin77"]} pcbX="-2.8952189999999973mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin78"]} pcbX="-2.2452330000000984mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin79"]} pcbX="-1.595246999999972mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin80"]} pcbX="-0.9452610000000732mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin81"]} pcbX="1.0049509999998918mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin82"]} pcbX="1.654937000000018mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin83"]} pcbX="2.304922999999917mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin84"]} pcbX="2.9549090000000433mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin85"]} pcbX="3.6048949999999422mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin86"]} pcbX="4.2548810000000685mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin87"]} pcbX="4.904867000000195mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin88"]} pcbX="5.554853000000094mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin89"]} pcbX="6.20483900000022mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin90"]} pcbX="-5.495162999999934mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin91"]} pcbX="-4.845177000000035mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin92"]} pcbX="-4.1951910000000225mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin93"]} pcbX="-3.5452049999998962mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin94"]} pcbX="-2.8952189999999973mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin95"]} pcbX="-2.2452330000000984mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin96"]} pcbX="-1.595246999999972mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin97"]} pcbX="-0.9452610000000732mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin98"]} pcbX="-0.2952749999999469mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin99"]} pcbX="0.35496499999999287mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin100"]} pcbX="1.0049509999998918mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin101"]} pcbX="1.654937000000018mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin102"]} pcbX="2.304922999999917mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin103"]} pcbX="2.9549090000000433mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin104"]} pcbX="3.6048949999999422mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin105"]} pcbX="4.2548810000000685mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin106"]} pcbX="5.554853000000094mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin107"]} pcbX="6.20483900000022mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin108"]} pcbX="4.904867000000195mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin109"]} pcbX="-2.8952189999999973mm" pcbY="4.8900079999998525mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin110"]} pcbX="-0.2952749999999469mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin111"]} pcbX="-0.9452610000000732mm" pcbY="3.590035999999941mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin112"]} pcbX="-0.2952749999999469mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin113"]} pcbX="0.35496499999999287mm" pcbY="2.9400499999999283mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin114"]} pcbX="-6.14514900000006mm" pcbY="2.2900639999999157mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin115"]} pcbX="-6.14514900000006mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin116"]} pcbX="-5.495162999999934mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin117"]} pcbX="-4.845177000000035mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin118"]} pcbX="-4.1951910000000225mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin119"]} pcbX="-3.5452049999998962mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin120"]} pcbX="-2.8952189999999973mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin121"]} pcbX="-2.2452330000000984mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin122"]} pcbX="-1.595246999999972mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin123"]} pcbX="-0.9452610000000732mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin124"]} pcbX="-0.2952749999999469mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin125"]} pcbX="0.35496499999999287mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin126"]} pcbX="1.0049509999998918mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin127"]} pcbX="1.654937000000018mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin128"]} pcbX="2.9549090000000433mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin129"]} pcbX="5.554853000000094mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin130"]} pcbX="2.304922999999917mm" pcbY="-0.9601199999999608mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin131"]} pcbX="-5.495162999999934mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin132"]} pcbX="-4.845177000000035mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin133"]} pcbX="-4.1951910000000225mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin134"]} pcbX="-3.5452049999998962mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin135"]} pcbX="-2.8952189999999973mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin136"]} pcbX="-2.2452330000000984mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin137"]} pcbX="-1.595246999999972mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin138"]} pcbX="-0.9452610000000732mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin139"]} pcbX="-0.2952749999999469mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin140"]} pcbX="0.35496499999999287mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin141"]} pcbX="1.0049509999998918mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin142"]} pcbX="1.654937000000018mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin143"]} pcbX="2.304922999999917mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin144"]} pcbX="2.9549090000000433mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin145"]} pcbX="3.6048949999999422mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin146"]} pcbX="4.2548810000000685mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin147"]} pcbX="4.904867000000195mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin148"]} pcbX="5.554853000000094mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin149"]} pcbX="6.20483900000022mm" pcbY="-0.31013400000006186mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin150"]} pcbX="-4.845177000000035mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin151"]} pcbX="-4.1951910000000225mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin152"]} pcbX="-3.5452049999998962mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin153"]} pcbX="-2.8952189999999973mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin154"]} pcbX="-2.2452330000000984mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin155"]} pcbX="-1.595246999999972mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin156"]} pcbX="-0.9452610000000732mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin157"]} pcbX="-0.2952749999999469mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin158"]} pcbX="1.0049509999998918mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin159"]} pcbX="1.654937000000018mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin160"]} pcbX="2.304922999999917mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin161"]} pcbX="2.9549090000000433mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin162"]} pcbX="3.6048949999999422mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin163"]} pcbX="4.2548810000000685mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin164"]} pcbX="4.904867000000195mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin165"]} pcbX="5.554853000000094mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin166"]} pcbX="6.20483900000022mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin167"]} pcbX="-6.14514900000006mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin168"]} pcbX="-5.495162999999934mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin169"]} pcbX="-4.845177000000035mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin170"]} pcbX="-4.1951910000000225mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin171"]} pcbX="-3.5452049999998962mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin172"]} pcbX="-2.8952189999999973mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin173"]} pcbX="-2.2452330000000984mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin174"]} pcbX="-1.595246999999972mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin175"]} pcbX="-0.9452610000000732mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin176"]} pcbX="0.35496499999999287mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin177"]} pcbX="1.0049509999998918mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin178"]} pcbX="1.654937000000018mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin179"]} pcbX="2.9549090000000433mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin180"]} pcbX="3.6048949999999422mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin181"]} pcbX="4.2548810000000685mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin182"]} pcbX="4.904867000000195mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin183"]} pcbX="5.554853000000094mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin184"]} pcbX="6.20483900000022mm" pcbY="-4.86003600000015mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin185"]} pcbX="-6.14514900000006mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin186"]} pcbX="-5.495162999999934mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin187"]} pcbX="-4.845177000000035mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin188"]} pcbX="-4.1951910000000225mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin189"]} pcbX="-3.5452049999998962mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin190"]} pcbX="-2.8952189999999973mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin191"]} pcbX="-2.2452330000000984mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin192"]} pcbX="-1.595246999999972mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin193"]} pcbX="-0.9452610000000732mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin194"]} pcbX="0.35496499999999287mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin195"]} pcbX="1.0049509999998918mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin196"]} pcbX="1.654937000000018mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin197"]} pcbX="2.9549090000000433mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin198"]} pcbX="3.6048949999999422mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin199"]} pcbX="4.2548810000000685mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin200"]} pcbX="4.904867000000195mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin201"]} pcbX="5.554853000000094mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin202"]} pcbX="6.20483900000022mm" pcbY="-5.510022000000049mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin203"]} pcbX="0.35496499999999287mm" pcbY="-1.6101059999999734mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin204"]} pcbX="-7.370190999999977mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin205"]} pcbX="-6.970141000000012mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin206"]} pcbX="-6.570090999999934mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin207"]} pcbX="-5.770245000000045mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin208"]} pcbX="-4.970145000000002mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin209"]} pcbX="-4.170045000000073mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin210"]} pcbX="-3.7702489999999216mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin211"]} pcbX="-2.970149000000106mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin212"]} pcbX="-2.5700989999999138mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin213"]} pcbX="-1.7702529999999115mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin214"]} pcbX="-0.9701529999999821mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin215"]} pcbX="-0.17005299999993895mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin216"]} pcbX="0.22974299999998493mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin217"]} pcbX="1.029843000000028mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin218"]} pcbX="1.4298929999999928mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin219"]} pcbX="2.6297889999999597mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin220"]} pcbX="3.029839000000152mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin221"]} pcbX="3.8299389999999676mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin222"]} pcbX="4.229734999999891mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin223"]} pcbX="5.029834999999821mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin224"]} pcbX="5.429884999999786mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin225"]} pcbX="6.229731000000129mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin226"]} pcbX="7.029831000000058mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin227"]} pcbX="7.429881000000023mm" pcbY="6.815073999999868mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin228"]} pcbX="-7.370190999999977mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin229"]} pcbX="-6.970141000000012mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin230"]} pcbX="-6.570090999999934mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin231"]} pcbX="-6.170040999999969mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin232"]} pcbX="-5.770245000000045mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin233"]} pcbX="-5.370195000000081mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin234"]} pcbX="-4.970145000000002mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin235"]} pcbX="-4.5700950000000375mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin236"]} pcbX="-4.170045000000073mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin237"]} pcbX="-3.7702489999999216mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin238"]} pcbX="-3.370198999999843mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin239"]} pcbX="-2.970149000000106mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin240"]} pcbX="-2.5700989999999138mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin241"]} pcbX="-2.1700490000000627mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin242"]} pcbX="-1.7702529999999115mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin243"]} pcbX="-1.3702030000001741mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin244"]} pcbX="-0.9701529999999821mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin245"]} pcbX="-0.5701029999999037mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin246"]} pcbX="-0.17005299999993895mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin247"]} pcbX="0.22974299999998493mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin248"]} pcbX="0.6297929999999496mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin249"]} pcbX="1.029843000000028mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin250"]} pcbX="1.4298929999999928mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin251"]} pcbX="1.8299429999999575mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin252"]} pcbX="2.229738999999995mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin253"]} pcbX="2.6297889999999597mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin254"]} pcbX="3.029839000000152mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin255"]} pcbX="3.429888999999889mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin256"]} pcbX="3.8299389999999676mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin257"]} pcbX="4.229734999999891mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin258"]} pcbX="4.6297850000000835mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin259"]} pcbX="5.029834999999821mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin260"]} pcbX="5.429884999999786mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin261"]} pcbX="5.829934999999978mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin262"]} pcbX="6.229731000000129mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin263"]} pcbX="6.629781000000094mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin264"]} pcbX="7.029831000000058mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin265"]} pcbX="7.429881000000023mm" pcbY="6.415024000000017mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin266"]} pcbX="-7.370190999999977mm" pcbY="6.014973999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin267"]} pcbX="-6.970141000000012mm" pcbY="6.014973999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin268"]} pcbX="7.029831000000058mm" pcbY="6.014973999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin269"]} pcbX="-6.970141000000012mm" pcbY="5.614923999999974mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin270"]} pcbX="7.029831000000058mm" pcbY="5.614923999999974mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin271"]} pcbX="7.429881000000023mm" pcbY="5.614923999999974mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin272"]} pcbX="-7.370190999999977mm" pcbY="5.214873999999895mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin273"]} pcbX="-6.970141000000012mm" pcbY="5.214873999999895mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin274"]} pcbX="7.029831000000058mm" pcbY="5.214873999999895mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin275"]} pcbX="-7.370190999999977mm" pcbY="4.815077999999971mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin276"]} pcbX="-6.970141000000012mm" pcbY="4.815077999999971mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin277"]} pcbX="7.029831000000058mm" pcbY="4.815077999999971mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin278"]} pcbX="7.429881000000023mm" pcbY="4.815077999999971mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin279"]} pcbX="-6.970141000000012mm" pcbY="4.415028000000007mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin280"]} pcbX="7.029831000000058mm" pcbY="4.415028000000007mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin281"]} pcbX="7.429881000000023mm" pcbY="4.415028000000007mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin282"]} pcbX="-7.370190999999977mm" pcbY="4.014977999999928mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin283"]} pcbX="-6.970141000000012mm" pcbY="4.014977999999928mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin284"]} pcbX="7.029831000000058mm" pcbY="4.014977999999928mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin285"]} pcbX="-6.970141000000012mm" pcbY="3.6149279999999635mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin286"]} pcbX="7.029831000000058mm" pcbY="3.6149279999999635mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin287"]} pcbX="7.429881000000023mm" pcbY="3.6149279999999635mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin288"]} pcbX="-7.370190999999977mm" pcbY="3.214877999999999mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin289"]} pcbX="-6.970141000000012mm" pcbY="3.214877999999999mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin290"]} pcbX="7.029831000000058mm" pcbY="3.214877999999999mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin291"]} pcbX="7.429881000000023mm" pcbY="3.214877999999999mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin292"]} pcbX="-6.970141000000012mm" pcbY="2.8150819999999612mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin293"]} pcbX="7.029831000000058mm" pcbY="2.8150819999999612mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin294"]} pcbX="-7.370190999999977mm" pcbY="2.4150319999999965mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin295"]} pcbX="-6.970141000000012mm" pcbY="2.4150319999999965mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin296"]} pcbX="7.029831000000058mm" pcbY="2.4150319999999965mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin297"]} pcbX="7.429881000000023mm" pcbY="2.4150319999999965mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin298"]} pcbX="-7.370190999999977mm" pcbY="2.014981999999918mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin299"]} pcbX="-6.970141000000012mm" pcbY="2.014981999999918mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin300"]} pcbX="7.029831000000058mm" pcbY="2.014981999999918mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin301"]} pcbX="7.429881000000023mm" pcbY="2.014981999999918mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin302"]} pcbX="-6.970141000000012mm" pcbY="1.614932000000067mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin303"]} pcbX="7.029831000000058mm" pcbY="1.614932000000067mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin304"]} pcbX="-7.370190999999977mm" pcbY="1.2148819999999887mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin305"]} pcbX="-6.970141000000012mm" pcbY="1.2148819999999887mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin306"]} pcbX="7.029831000000058mm" pcbY="1.2148819999999887mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin307"]} pcbX="7.429881000000023mm" pcbY="1.2148819999999887mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin308"]} pcbX="-6.970141000000012mm" pcbY="0.8150859999999511mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin309"]} pcbX="7.029831000000058mm" pcbY="0.8150859999999511mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin310"]} pcbX="7.429881000000023mm" pcbY="0.8150859999999511mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin311"]} pcbX="-6.970141000000012mm" pcbY="0.41503599999987273mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin312"]} pcbX="7.029831000000058mm" pcbY="0.41503599999987273mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin313"]} pcbX="-7.370190999999977mm" pcbY="0.014986000000021704mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin314"]} pcbX="-6.970141000000012mm" pcbY="0.014986000000021704mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin315"]} pcbX="7.029831000000058mm" pcbY="0.014986000000021704mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin316"]} pcbX="7.429881000000023mm" pcbY="0.014986000000021704mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin317"]} pcbX="-6.970141000000012mm" pcbY="-0.385063999999943mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin318"]} pcbX="7.029831000000058mm" pcbY="-0.385063999999943mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin319"]} pcbX="7.429881000000023mm" pcbY="-0.385063999999943mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin320"]} pcbX="-7.370190999999977mm" pcbY="-0.7851140000000214mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin321"]} pcbX="-6.970141000000012mm" pcbY="-0.7851140000000214mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin322"]} pcbX="7.029831000000058mm" pcbY="-0.7851140000000214mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin323"]} pcbX="-6.970141000000012mm" pcbY="-1.184910000000059mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin324"]} pcbX="7.029831000000058mm" pcbY="-1.184910000000059mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin325"]} pcbX="7.429881000000023mm" pcbY="-1.184910000000059mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin326"]} pcbX="-7.370190999999977mm" pcbY="-1.5849600000000237mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin327"]} pcbX="-6.970141000000012mm" pcbY="-1.5849600000000237mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin328"]} pcbX="7.029831000000058mm" pcbY="-1.5849600000000237mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin329"]} pcbX="7.429881000000023mm" pcbY="-1.5849600000000237mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin330"]} pcbX="-6.970141000000012mm" pcbY="-1.985010000000102mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin331"]} pcbX="7.029831000000058mm" pcbY="-1.985010000000102mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin332"]} pcbX="-7.370190999999977mm" pcbY="-2.385060000000067mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin333"]} pcbX="-6.970141000000012mm" pcbY="-2.385060000000067mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin334"]} pcbX="7.029831000000058mm" pcbY="-2.385060000000067mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin335"]} pcbX="7.429881000000023mm" pcbY="-2.385060000000067mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin336"]} pcbX="-6.970141000000012mm" pcbY="-2.785109999999918mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin337"]} pcbX="7.029831000000058mm" pcbY="-2.785109999999918mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin338"]} pcbX="-7.370190999999977mm" pcbY="-3.1849059999999554mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin339"]} pcbX="-6.970141000000012mm" pcbY="-3.1849059999999554mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin340"]} pcbX="7.029831000000058mm" pcbY="-3.1849059999999554mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin341"]} pcbX="7.429881000000023mm" pcbY="-3.1849059999999554mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin342"]} pcbX="-6.970141000000012mm" pcbY="-3.5849560000001475mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin343"]} pcbX="7.029831000000058mm" pcbY="-3.5849560000001475mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin344"]} pcbX="7.429881000000023mm" pcbY="-3.5849560000001475mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin345"]} pcbX="-6.970141000000012mm" pcbY="-3.9850059999999985mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin346"]} pcbX="7.029831000000058mm" pcbY="-3.9850059999999985mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin347"]} pcbX="-7.370190999999977mm" pcbY="-4.385055999999963mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin348"]} pcbX="-6.970141000000012mm" pcbY="-4.385055999999963mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin349"]} pcbX="7.029831000000058mm" pcbY="-4.385055999999963mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin350"]} pcbX="7.429881000000023mm" pcbY="-4.385055999999963mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin351"]} pcbX="-6.970141000000012mm" pcbY="-4.785106000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin352"]} pcbX="7.029831000000058mm" pcbY="-4.785106000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin353"]} pcbX="7.429881000000023mm" pcbY="-4.785106000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin354"]} pcbX="-7.370190999999977mm" pcbY="-5.184902000000079mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin355"]} pcbX="-6.970141000000012mm" pcbY="-5.184902000000079mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin356"]} pcbX="7.029831000000058mm" pcbY="-5.184902000000079mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin357"]} pcbX="-7.370190999999977mm" pcbY="-5.584952000000044mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin358"]} pcbX="-6.970141000000012mm" pcbY="-5.584952000000044mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin359"]} pcbX="7.029831000000058mm" pcbY="-5.584952000000044mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin360"]} pcbX="7.429881000000023mm" pcbY="-5.584952000000044mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin361"]} pcbX="-6.970141000000012mm" pcbY="-5.985002000000009mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin362"]} pcbX="7.029831000000058mm" pcbY="-5.985002000000009mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin363"]} pcbX="7.429881000000023mm" pcbY="-5.985002000000009mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin364"]} pcbX="-7.370190999999977mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin365"]} pcbX="-6.970141000000012mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin366"]} pcbX="-6.570090999999934mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin367"]} pcbX="-6.170040999999969mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin368"]} pcbX="-5.770245000000045mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin369"]} pcbX="-5.370195000000081mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin370"]} pcbX="-4.970145000000002mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin371"]} pcbX="-4.5700950000000375mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin372"]} pcbX="-4.170045000000073mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin373"]} pcbX="-3.7702489999999216mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin374"]} pcbX="-3.370198999999843mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin375"]} pcbX="-2.970149000000106mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin376"]} pcbX="-2.5700989999999138mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin377"]} pcbX="-2.1700490000000627mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin378"]} pcbX="-1.7702529999999115mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin379"]} pcbX="-1.3702030000001741mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin380"]} pcbX="-0.9701529999999821mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin381"]} pcbX="-0.5701029999999037mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin382"]} pcbX="-0.17005299999993895mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin383"]} pcbX="0.22974299999998493mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin384"]} pcbX="0.6297929999999496mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin385"]} pcbX="1.029843000000028mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin386"]} pcbX="1.4298929999999928mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin387"]} pcbX="1.8299429999999575mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin388"]} pcbX="2.229738999999995mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin389"]} pcbX="2.6297889999999597mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin390"]} pcbX="3.029839000000152mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin391"]} pcbX="3.429888999999889mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin392"]} pcbX="3.8299389999999676mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin393"]} pcbX="4.229734999999891mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin394"]} pcbX="4.6297850000000835mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin395"]} pcbX="5.029834999999821mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin396"]} pcbX="5.429884999999786mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin397"]} pcbX="5.829934999999978mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin398"]} pcbX="6.229731000000129mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin399"]} pcbX="6.629781000000094mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin400"]} pcbX="7.029831000000058mm" pcbY="-6.385052000000087mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin401"]} pcbX="-7.370190999999977mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin402"]} pcbX="-6.970141000000012mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin403"]} pcbX="-6.170040999999969mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin404"]} pcbX="-5.370195000000081mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin405"]} pcbX="-4.970145000000002mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin406"]} pcbX="-4.170045000000073mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin407"]} pcbX="-3.7702489999999216mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin408"]} pcbX="-2.970149000000106mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin409"]} pcbX="-2.1700490000000627mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin410"]} pcbX="-1.7702529999999115mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin411"]} pcbX="-0.9701529999999821mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin412"]} pcbX="-0.5701029999999037mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin413"]} pcbX="0.22974299999998493mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin414"]} pcbX="0.6297929999999496mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin415"]} pcbX="1.4298929999999928mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin416"]} pcbX="1.8299429999999575mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin417"]} pcbX="2.6297889999999597mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin418"]} pcbX="3.029839000000152mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin419"]} pcbX="3.8299389999999676mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin420"]} pcbX="4.229734999999891mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin421"]} pcbX="5.029834999999821mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin422"]} pcbX="5.429884999999786mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin423"]} pcbX="6.229731000000129mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin424"]} pcbX="6.629781000000094mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin425"]} pcbX="7.429881000000023mm" pcbY="-6.785101999999938mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin426"]} pcbX="-6.14514900000006mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin427"]} pcbX="-5.495162999999934mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin428"]} pcbX="-4.845177000000035mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin429"]} pcbX="-4.1951910000000225mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin430"]} pcbX="-3.5452049999998962mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin431"]} pcbX="-2.8952189999999973mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin432"]} pcbX="-2.2452330000000984mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin433"]} pcbX="-1.595246999999972mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin434"]} pcbX="-0.9452610000000732mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin435"]} pcbX="-0.2952749999999469mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin436"]} pcbX="0.35496499999999287mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin437"]} pcbX="1.0049509999998918mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin438"]} pcbX="1.654937000000018mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin439"]} pcbX="2.304922999999917mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin440"]} pcbX="2.9549090000000433mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin441"]} pcbX="3.6048949999999422mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin442"]} pcbX="4.2548810000000685mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin443"]} pcbX="4.904867000000195mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin444"]} pcbX="5.554853000000094mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin445"]} pcbX="6.20483900000022mm" pcbY="1.6400780000000168mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin446"]} pcbX="-6.14514900000006mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin447"]} pcbX="-5.495162999999934mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin448"]} pcbX="-4.845177000000035mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin449"]} pcbX="-4.1951910000000225mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin450"]} pcbX="-3.5452049999998962mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin451"]} pcbX="-2.8952189999999973mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin452"]} pcbX="-2.2452330000000984mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin453"]} pcbX="-1.595246999999972mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin454"]} pcbX="-0.9452610000000732mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin455"]} pcbX="-0.2952749999999469mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin456"]} pcbX="0.35496499999999287mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin457"]} pcbX="1.654937000000018mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin458"]} pcbX="2.304922999999917mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin459"]} pcbX="2.9549090000000433mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin460"]} pcbX="3.6048949999999422mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin461"]} pcbX="4.2548810000000685mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin462"]} pcbX="4.904867000000195mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin463"]} pcbX="5.554853000000094mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin464"]} pcbX="6.20483900000022mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin465"]} pcbX="1.0049509999998918mm" pcbY="0.9900920000000042mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin466"]} pcbX="-6.14514900000006mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin467"]} pcbX="-5.495162999999934mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin468"]} pcbX="-4.845177000000035mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin469"]} pcbX="-4.1951910000000225mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin470"]} pcbX="-3.5452049999998962mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin471"]} pcbX="-2.8952189999999973mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin472"]} pcbX="-2.2452330000000984mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin473"]} pcbX="-1.595246999999972mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin474"]} pcbX="-0.9452610000000732mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin475"]} pcbX="-0.2952749999999469mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin476"]} pcbX="0.35496499999999287mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin477"]} pcbX="1.0049509999998918mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin478"]} pcbX="1.654937000000018mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin479"]} pcbX="2.304922999999917mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin480"]} pcbX="2.9549090000000433mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin481"]} pcbX="3.6048949999999422mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin482"]} pcbX="4.2548810000000685mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin483"]} pcbX="4.904867000000195mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin484"]} pcbX="5.554853000000094mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin485"]} pcbX="6.20483900000022mm" pcbY="0.3401059999999916mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin486"]} pcbX="-6.14514900000006mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin487"]} pcbX="-5.495162999999934mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin488"]} pcbX="-4.845177000000035mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin489"]} pcbX="-4.1951910000000225mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin490"]} pcbX="-3.5452049999998962mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin491"]} pcbX="-2.8952189999999973mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin492"]} pcbX="-2.2452330000000984mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin493"]} pcbX="-1.595246999999972mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin494"]} pcbX="-0.9452610000000732mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin495"]} pcbX="-0.2952749999999469mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin496"]} pcbX="0.35496499999999287mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin497"]} pcbX="1.0049509999998918mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin498"]} pcbX="1.654937000000018mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin499"]} pcbX="2.304922999999917mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin500"]} pcbX="2.9549090000000433mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin501"]} pcbX="3.6048949999999422mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin502"]} pcbX="4.2548810000000685mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin503"]} pcbX="4.904867000000195mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin504"]} pcbX="5.554853000000094mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin505"]} pcbX="6.20483900000022mm" pcbY="-2.260091999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin506"]} pcbX="-6.14514900000006mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin507"]} pcbX="-5.495162999999934mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin508"]} pcbX="-4.845177000000035mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin509"]} pcbX="-4.1951910000000225mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin510"]} pcbX="-3.5452049999998962mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin511"]} pcbX="-2.8952189999999973mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin512"]} pcbX="-2.2452330000000984mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin513"]} pcbX="-1.595246999999972mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin514"]} pcbX="-0.9452610000000732mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin515"]} pcbX="-0.2952749999999469mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin516"]} pcbX="0.35496499999999287mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin517"]} pcbX="1.0049509999998918mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin518"]} pcbX="1.654937000000018mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin519"]} pcbX="2.304922999999917mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin520"]} pcbX="2.9549090000000433mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin521"]} pcbX="3.6048949999999422mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin522"]} pcbX="4.2548810000000685mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin523"]} pcbX="4.904867000000195mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin524"]} pcbX="5.554853000000094mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin525"]} pcbX="6.20483900000022mm" pcbY="-2.9100779999999986mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin526"]} pcbX="-6.14514900000006mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin527"]} pcbX="-5.495162999999934mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin528"]} pcbX="-4.845177000000035mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin529"]} pcbX="-4.1951910000000225mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin530"]} pcbX="-3.5452049999998962mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin531"]} pcbX="-2.8952189999999973mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin532"]} pcbX="-2.2452330000000984mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin533"]} pcbX="-1.595246999999972mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin534"]} pcbX="-0.9452610000000732mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin535"]} pcbX="-0.2952749999999469mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin536"]} pcbX="0.35496499999999287mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin537"]} pcbX="1.0049509999998918mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin538"]} pcbX="1.654937000000018mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin539"]} pcbX="2.304922999999917mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin540"]} pcbX="2.9549090000000433mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin541"]} pcbX="3.6048949999999422mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin542"]} pcbX="4.2548810000000685mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin543"]} pcbX="4.904867000000195mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin544"]} pcbX="5.554853000000094mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin545"]} pcbX="6.20483900000022mm" pcbY="-3.5600639999998975mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin546"]} pcbX="-6.14514900000006mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin547"]} pcbX="-5.495162999999934mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin548"]} pcbX="-4.845177000000035mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin549"]} pcbX="-4.1951910000000225mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin550"]} pcbX="-3.5452049999998962mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin551"]} pcbX="-2.8952189999999973mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin552"]} pcbX="-2.2452330000000984mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin553"]} pcbX="-1.595246999999972mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin554"]} pcbX="-0.9452610000000732mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin555"]} pcbX="-0.2952749999999469mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin556"]} pcbX="0.35496499999999287mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin557"]} pcbX="1.654937000000018mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin558"]} pcbX="2.304922999999917mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin559"]} pcbX="2.9549090000000433mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin560"]} pcbX="3.6048949999999422mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin561"]} pcbX="4.2548810000000685mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin562"]} pcbX="4.904867000000195mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin563"]} pcbX="5.554853000000094mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin564"]} pcbX="6.20483900000022mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<smtpad portHints={["pin565"]} pcbX="1.0049509999998918mm" pcbY="-4.210050000000024mm" layer="top" radius="0.10999469999999999mm" shape="circle" />
<silkscreenrect pcbX={0} pcbY={0} width={15.599918} height={14.450059999999999} layer="top" strokeWidth={0.254} filled={false} />
<silkscreencircle pcbX={-8.300084999999967} pcbY={6.885177999999883} radius={0.199898} layer="top" strokeWidth={0.39999919999999994} />
<courtyardoutline outline={[{"x":-8.757856999999944,"y":7.4971279999998615},{"x":8.048943000000008,"y":7.4971279999998615},{"x":8.048943000000008,"y":-7.48087200000009},{"x":-8.757856999999944,"y":-7.48087200000009},{"x":-8.757856999999944,"y":7.4971279999998615}]} layer="top" />
      </footprint>}
    pinLabels={pinLabels}
    pinAttributes={{
  "pin1": {
    "isOutput": true
  },
  "pin2": {
    "isOutput": true
  },
  "pin3": {
    "isOutput": true
  },
  "pin4": {
    "isOutput": true
  },
  "pin5": {
    "isOutput": true
  },
  "pin6": {
    "isOutput": true
  },
  "pin7": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin8": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin9": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin10": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin11": {
    "isOutput": true
  },
  "pin12": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin13": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin14": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_sck"
    ]
  },
  "pin15": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_cs"
    ]
  },
  "pin16": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin17": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin18": {
    "isInput": true
  },
  "pin19": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin20": {
    "isOutput": true
  },
  "pin21": {
    "isOutput": true
  },
  "pin22": {
    "isOutput": true
  },
  "pin23": {
    "isOutput": true
  },
  "pin24": {
    "isOutput": true
  },
  "pin25": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin26": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin27": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin28": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin29": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin30": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin31": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin32": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_cs"
    ]
  },
  "pin33": {
    "isInput": true
  },
  "pin34": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin35": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_cs"
    ]
  },
  "pin36": {
    "isOutput": true
  },
  "pin37": {
    "isOutput": true
  },
  "pin38": {
    "isOutput": true
  },
  "pin39": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin40": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin41": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin42": {
    "isOutput": true
  },
  "pin43": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin44": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin45": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin46": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin47": {
    "isInput": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin48": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin49": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin50": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin51": {
    "isInput": true
  },
  "pin52": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin53": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin54": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin55": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin56": {
    "isOutput": true
  },
  "pin57": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin58": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin59": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin60": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin61": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin62": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin63": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin64": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin65": {
    "isInput": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin66": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin67": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 1.8,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin68": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 1.8,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin69": {
    "isInput": true
  },
  "pin70": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin71": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_mosi"
    ]
  },
  "pin72": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin73": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin74": {
    "isOutput": true
  },
  "pin75": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin76": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin77": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin78": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin79": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin80": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin81": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin82": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin83": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin84": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin85": {
    "isInput": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin86": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin87": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin88": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin89": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin90": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin91": {
    "isPassive": true,
    "mustBeConnected": true,
    "includeInBoardPinout": false
  },
  "pin92": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin93": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin94": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin95": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin96": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin97": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin98": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin99": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin100": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin101": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin102": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin103": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin104": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin105": {
    "isInput": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin106": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin107": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin108": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin109": {
    "isOutput": true
  },
  "pin110": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin111": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin112": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin113": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin114": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin115": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin116": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_miso"
    ]
  },
  "pin117": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin118": {
    "isInput": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin119": {
    "isInput": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin120": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin121": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin122": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin123": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin124": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin125": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin126": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin127": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin128": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin129": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin130": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin131": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin132": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin133": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin134": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin135": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin136": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin137": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin138": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin139": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin140": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin141": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin142": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin143": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin144": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin145": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 0.9,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin146": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 1.8,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin147": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin148": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true
  },
  "pin149": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true
  },
  "pin150": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin151": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin152": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin153": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin154": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin155": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin156": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin157": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin158": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin159": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin160": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin161": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin162": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin163": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin164": {
    "mustBeConnected": true,
    "requiresGround": true,
    "includeInBoardPinout": false
  },
  "pin165": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin166": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin167": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin168": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin169": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_sda"
    ]
  },
  "pin170": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin171": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_cs"
    ]
  },
  "pin172": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_miso",
      "uart_tx"
    ]
  },
  "pin173": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_sck"
    ]
  },
  "pin174": {
    "isInput": true
  },
  "pin175": {
    "isInput": true
  },
  "pin176": {
    "isOutput": true
  },
  "pin177": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin178": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin179": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin180": {
    "isPassive": true,
    "mustBeConnected": true,
    "includeInBoardPinout": false
  },
  "pin181": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin182": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin183": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_miso"
    ]
  },
  "pin184": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_scl",
      "spi_sck"
    ]
  },
  "pin185": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin186": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_sda"
    ]
  },
  "pin187": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin188": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin189": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_cs"
    ]
  },
  "pin190": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin191": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin192": {
    "isInput": true
  },
  "pin193": {
    "isInput": true
  },
  "pin194": {
    "isOutput": true
  },
  "pin195": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin196": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin197": {
    "isOutput": true
  },
  "pin198": {
    "isOutput": true
  },
  "pin199": {
    "isInput": true
  },
  "pin200": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin201": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin202": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin203": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin204": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin205": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin206": {
    "isOutput": true
  },
  "pin207": {
    "isOutput": true
  },
  "pin208": {
    "isOutput": true
  },
  "pin209": {
    "isOutput": true
  },
  "pin210": {
    "isOutput": true
  },
  "pin211": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin212": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin213": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin214": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin215": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin216": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin217": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_sda",
      "uart_rx"
    ]
  },
  "pin218": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin219": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin220": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin221": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin222": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin223": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin224": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin225": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_sda"
    ]
  },
  "pin226": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_cs"
    ]
  },
  "pin227": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin228": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin229": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin230": {
    "isOutput": true
  },
  "pin231": {
    "isOutput": true
  },
  "pin232": {
    "isOutput": true
  },
  "pin233": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin234": {
    "isOutput": true
  },
  "pin235": {
    "isOutput": true
  },
  "pin236": {
    "isOutput": true
  },
  "pin237": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin238": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin239": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin240": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin241": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin242": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin243": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin244": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin245": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin246": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin247": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin248": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin249": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_scl",
      "uart_tx"
    ]
  },
  "pin250": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin251": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin252": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin253": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin254": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin255": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin256": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin257": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin258": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin259": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin260": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin261": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_scl"
    ]
  },
  "pin262": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin263": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_sck"
    ]
  },
  "pin264": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin265": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_cs",
      "uart_rx"
    ]
  },
  "pin266": {
    "isOutput": true
  },
  "pin267": {
    "isOutput": true
  },
  "pin268": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_miso"
    ]
  },
  "pin269": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin270": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_cs",
      "uart_tx"
    ]
  },
  "pin271": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_mosi"
    ]
  },
  "pin272": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin273": {
    "isOutput": true
  },
  "pin274": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin275": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin276": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin277": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_sck"
    ]
  },
  "pin278": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin279": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin280": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_miso"
    ]
  },
  "pin281": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin282": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin283": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin284": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin285": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin286": {
    "isOutput": true
  },
  "pin287": {
    "isOutput": true
  },
  "pin288": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin289": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin290": {
    "isOutput": true
  },
  "pin291": {
    "isOutput": true
  },
  "pin292": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin293": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin294": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin295": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin296": {
    "isOutput": true
  },
  "pin297": {
    "isOutput": true
  },
  "pin298": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin299": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin300": {
    "isOutput": true
  },
  "pin301": {
    "isOutput": true
  },
  "pin302": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin303": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin304": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin305": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin306": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true
  },
  "pin307": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true
  },
  "pin308": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin309": {
    "isInput": true,
    "canUseInternalPullup": true
  },
  "pin310": {
    "isInput": true
  },
  "pin311": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin312": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin313": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true
  },
  "pin314": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true
  },
  "pin315": {
    "isInput": true
  },
  "pin316": {
    "isInput": true
  },
  "pin317": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin318": {
    "isOutput": true
  },
  "pin319": {
    "isOutput": true
  },
  "pin320": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true
  },
  "pin321": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true
  },
  "pin322": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin323": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin324": {
    "isOutput": true
  },
  "pin325": {
    "isOutput": true
  },
  "pin326": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin327": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin328": {
    "isInput": true
  },
  "pin329": {
    "isInput": true
  },
  "pin330": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin331": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin332": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_scl"
    ]
  },
  "pin333": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin334": {
    "isInput": true
  },
  "pin335": {
    "isOutput": true
  },
  "pin336": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_scl",
      "spi_sck"
    ]
  },
  "pin337": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin338": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_sda"
    ]
  },
  "pin339": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_sda",
      "spi_mosi"
    ]
  },
  "pin340": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin341": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin342": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin343": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin344": {
    "isInput": true,
    "canUseInternalPullup": true
  },
  "pin345": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_cs"
    ]
  },
  "pin346": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin347": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin348": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin349": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_scl"
    ]
  },
  "pin350": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin351": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin352": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_scl"
    ]
  },
  "pin353": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_sda"
    ]
  },
  "pin354": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin355": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin356": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin357": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin358": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin359": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin360": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_sda"
    ]
  },
  "pin361": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin362": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_cs"
    ]
  },
  "pin363": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin364": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin365": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin366": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_miso",
      "uart_tx"
    ]
  },
  "pin367": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_mosi"
    ]
  },
  "pin368": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin369": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_scl"
    ]
  },
  "pin370": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin371": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin372": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin373": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin374": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_sda"
    ]
  },
  "pin375": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_mosi"
    ]
  },
  "pin376": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin377": {
    "isInput": true
  },
  "pin378": {
    "isInput": true
  },
  "pin379": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin380": {
    "isInput": true
  },
  "pin381": {
    "isInput": true
  },
  "pin382": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin383": {
    "isOutput": true
  },
  "pin384": {
    "isOutput": true
  },
  "pin385": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin386": {
    "isOutput": true
  },
  "pin387": {
    "isOutput": true
  },
  "pin388": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin389": {
    "isOutput": true
  },
  "pin390": {
    "isOutput": true
  },
  "pin391": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin392": {
    "isOutput": true
  },
  "pin393": {
    "isOutput": true
  },
  "pin394": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin395": {
    "isOutput": true
  },
  "pin396": {
    "isOutput": true
  },
  "pin397": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin398": {
    "isOutput": true
  },
  "pin399": {
    "isOutput": true
  },
  "pin400": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin401": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin402": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_sck",
      "uart_rx"
    ]
  },
  "pin403": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin404": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin405": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin406": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin407": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin408": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_scl"
    ]
  },
  "pin409": {
    "isInput": true
  },
  "pin410": {
    "isInput": true
  },
  "pin411": {
    "isInput": true
  },
  "pin412": {
    "isInput": true
  },
  "pin413": {
    "isOutput": true
  },
  "pin414": {
    "isOutput": true
  },
  "pin415": {
    "isOutput": true
  },
  "pin416": {
    "isOutput": true
  },
  "pin417": {
    "isOutput": true
  },
  "pin418": {
    "isOutput": true
  },
  "pin419": {
    "isOutput": true
  },
  "pin420": {
    "isOutput": true
  },
  "pin421": {
    "isOutput": true
  },
  "pin422": {
    "isOutput": true
  },
  "pin423": {
    "isOutput": true
  },
  "pin424": {
    "isOutput": true
  },
  "pin425": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin426": {
    "isOutput": true
  },
  "pin427": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true
  },
  "pin428": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin429": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin430": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin431": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin432": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin433": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin434": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin435": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin436": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin437": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin438": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin439": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin440": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin441": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin442": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 1.8,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin443": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin444": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin445": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin446": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin447": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin448": {
    "isOutput": true,
    "providesPower": true,
    "includeInBoardPinout": false
  },
  "pin449": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 1.8,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin450": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 0.9,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin451": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin452": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin453": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin454": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin455": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin456": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin457": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin458": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin459": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin460": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 1.8,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin461": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 0.9,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin462": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 3.3,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin463": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true
  },
  "pin464": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true
  },
  "pin465": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin466": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin467": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 3.3,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin468": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 1.8,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin469": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 0.9,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin470": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin471": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin472": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin473": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin474": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin475": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin476": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin477": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin478": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin479": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin480": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin481": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin482": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 0.9,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin483": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin484": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true
  },
  "pin485": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true
  },
  "pin486": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_cs"
    ]
  },
  "pin487": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin488": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin489": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin490": {
    "isInput": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin491": {
    "isInput": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin492": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin493": {
    "isInput": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin494": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 0.9,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin495": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 0.9,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin496": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin497": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin498": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 0.9,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin499": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 0.9,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin500": {
    "isInput": true,
    "requiresPower": true,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin501": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 0.9,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin502": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin503": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 1.8,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin504": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin505": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin506": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin507": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin508": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin509": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin510": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin511": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin512": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin513": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin514": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 1.8,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin515": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin516": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 0.9,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin517": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 1.8,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin518": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 1.8,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin519": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin520": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin521": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 3.3,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin522": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 0.9,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin523": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin524": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin525": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin526": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin527": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin528": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin529": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin530": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin531": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin532": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin533": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin534": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin535": {
    "isInput": true,
    "mustBeConnected": true,
    "requiresPower": true,
    "requiresVoltage": 1.8,
    "includeInBoardPinout": false,
    "shouldHaveDecouplingCapacitor": true
  },
  "pin536": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin537": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin538": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin539": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin540": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin541": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_sda",
      "spi_mosi"
    ]
  },
  "pin542": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin543": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_tx"
    ]
  },
  "pin544": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin545": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin546": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin547": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin548": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin549": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "canUseOpenDrain": true,
    "capabilities": [
      "i2c_scl"
    ]
  },
  "pin550": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin551": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_cs",
      "uart_rx"
    ]
  },
  "pin552": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin553": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin554": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin555": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin556": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin557": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin558": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin559": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin560": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin561": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  },
  "pin562": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "spi_cs"
    ]
  },
  "pin563": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true,
    "capabilities": [
      "uart_rx"
    ]
  },
  "pin564": {
    "isInput": true,
    "isOutput": true,
    "isBidirectional": true,
    "canUseTriState": true,
    "isGpio": true,
    "canUseInternalPullup": true,
    "canUseInternalPulldown": true
  },
  "pin565": {
    "mustBeConnected": true,
    "requiresGround": true,
    "requiresVoltage": 0,
    "includeInBoardPinout": false
  }
}}
    supplierPartNumbers={{
  "jlcpcb": [
    "C2943786"
  ]
}}
    manufacturerPartNumber="RK3566"
    cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2943786.obj?uuid=64b0ecebc40e4578851f9afd7fce5701",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2943786.step?uuid=64b0ecebc40e4578851f9afd7fce5701",
        pcbRotationOffset: 0,
        modelOriginPosition: {"x":-0.02988310000000638,"y":-0.015011399999934838,"z":-0.305},
    }}
    {...props}
  />
)