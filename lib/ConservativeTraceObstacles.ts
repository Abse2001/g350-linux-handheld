import type {Obstacle} from "@tscircuit/capacity-autorouter"

const bounds=(o:Obstacle)=>({left:o.center.x-o.width/2,right:o.center.x+o.width/2,
  bottom:o.center.y-o.height/2,top:o.center.y+o.height/2})

// Core samples diagonal manual traces into many small, overlapping rectangles.
// Compact adjacent samples into conservative envelopes, retaining every piece
// of original obstacle copper. Pads, drills, vias, keepouts and fine-pitch
// escapes remain untouched. This changes only the routing search geometry.
export function conservativeTraceObstacles(obstacles:Obstacle[]):Obstacle[]{
  const pads=obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id)
  const fixed:Obstacle[]=[],groups=new Map<string,Obstacle[]>()
  for(const obstacle of obstacles){
    const b=bounds(obstacle)
    const nearPad=pads.some(p=>p.layers.some(l=>obstacle.layers.includes(l)) &&
      b.left<=p.center.x+p.width/2+1 && b.right>=p.center.x-p.width/2-1 &&
      b.bottom<=p.center.y+p.height/2+1 && b.top>=p.center.y-p.height/2-1)
    if(obstacle.type!=="rect" || obstacle.shape || obstacle.obstacleId || obstacle.componentId ||
       obstacle.circuitJsonMetadata || obstacle.ccwRotationDegrees!==undefined || obstacle.isCopperPour ||
       obstacle.netIsAssignable || obstacle.offBoardConnectsTo ||
       obstacle.layers.length!==1 || nearPad ||
       !obstacle.connectedTo.some(id=>id.startsWith("source_trace_"))){
      fixed.push(obstacle);continue
    }
    const key=JSON.stringify([obstacle.layers,obstacle.connectedTo])
    if(!groups.has(key)) groups.set(key,[])
    groups.get(key)!.push(obstacle)
  }
  let envelopeId=0
  for(const group of groups.values()){
    let current:Obstacle|undefined
    const flush=()=>{if(current) fixed.push({...current,obstacleId:`manual_envelope_${envelopeId++}`})}
    for(const obstacle of group){
      if(!current){current=obstacle;continue}
      const a=bounds(current),b=bounds(obstacle)
      const left=Math.min(a.left,b.left),right=Math.max(a.right,b.right)
      const bottom=Math.min(a.bottom,b.bottom),top=Math.max(a.top,b.top)
      if(right-left<=.75 && top-bottom<=.75 && b.left<=a.right+1e-9 &&
         b.right>=a.left-1e-9 && b.bottom<=a.top+1e-9 && b.top>=a.bottom-1e-9){
        current={...current,center:{x:(left+right)/2,y:(bottom+top)/2},width:right-left,height:top-bottom}
      }else{flush();current=obstacle}
    }
    flush()
  }
  return fixed
}
