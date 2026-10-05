import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react"
import placements from "./host-placements.json"
import outline from "../../../mechanical/g350-provisional-outline.json"

type Props = Record<string, unknown> & {children?: ReactNode; name?: string}
const skippedFunctions = new Set(["FourLayerReferencePlanes", "RamReferenceEscapes", "RamBypassLoops"])
const skippedElements = new Set(["via", "copperpour", "silkscreentext"])

// Evaluate the existing, pure JSX component functions and apply an explicit
// placement table. Footprint/CAD props pass through untouched. This creates
// an editable source study; it does not move a frozen/routed CircuitJSON file.
// Copper and absolute guides are discarded before any component is moved.
export function layoutOnly(node: ReactNode): ReactNode {
  if (!isValidElement<Props>(node)) return node
  if (typeof node.type === "function") {
    if (skippedFunctions.has(node.type.name)) return null
    const render = node.type as (props: Props) => ReactNode
    return layoutOnly(render(node.props))
  }
  const type = typeof node.type === "string" ? node.type : "fragment"
  if (skippedElements.has(type)) return null
  const p: Props = {...node.props}
  if (type === "trace") {
    if ([p.from, p.to].some(v => typeof v === "string" && /V_DDR_CPU1_|RAM_ESCAPE_|RAM_BYPASS_/.test(v))) return null
    delete p.pcbPath
    delete p.pcbPathRelativeTo
  }
  const placement = (placements as Record<string, {x:number; y:number; layer:string; rotation:number}>)[p.name ?? ""]
  if (placement && !["trace", "net", "bus", "differentialpair", "board", "fragment"].includes(type)) {
    p.pcbX = placement.x
    p.pcbY = placement.y
    p.layer = placement.layer
    p.pcbRotation = placement.rotation
  }
  if (type === "testpoint") p.doNotPlace = true
  if (type === "keepout") {
    // Same manufacturer SD socket rectangles, translated with its package.
    p.pcbX = Number(p.pcbX) + placements.J_SD.x - 41
    p.pcbY = Number(p.pcbY) + placements.J_SD.y - 20
  }
  if (type === "board") {
    p.width = outline.width
    p.height = outline.height
    p.outline = outline.outline
    p.title = "G350 component placement study — original shell geometry unverified"
    p.routeRemaining = false
    p.schematicDisabled = true
  }
  return cloneElement(node as ReactElement<Props>, p, ...Children.toArray(node.props.children).map(layoutOnly))
}
