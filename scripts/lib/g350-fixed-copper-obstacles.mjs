import assert from 'node:assert/strict'

// Physical geometry adapter for native solver diagnostics. Every fixed via
// is a full-depth drill, even when a fanout route ends electrically on a
// plane. Sample fixed wire capsules conservatively; do not remove copper.
export function withG350FixedCopperObstacles(raw,{reserveWireCapsules=true,expectedThroughVias=101}={}){
 assert.equal(raw.layerCount,4)
 assert.equal(raw.allowBlindAndBuriedVias,false)
 const input=structuredClone(raw),vias=new Map(),wires=[]
 for(const trace of input.traces??[]){
  const connectedTo=[trace.connection_name??trace.source_trace_id??trace.pcb_trace_id]
  for(let i=0;i<trace.route.length;i++){
   const p=trace.route[i]
   if(p.route_type==='via'){
    assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254)
    const key=`${p.x.toFixed(8)},${p.y.toFixed(8)}`
    if(!vias.has(key))vias.set(key,{type:'rect',shape:'circle',center:{x:p.x,y:p.y},width:.4572,height:.4572,layers:['top','inner1','inner2','bottom'],connectedTo})
   }
   if(!reserveWireCapsules)continue
   const q=trace.route[i-1]
   if(!q||p.route_type!=='wire'||q.route_type!=='wire'||p.layer!==q.layer)continue
   const distance=Math.hypot(p.x-q.x,p.y-q.y)
   if(distance<1e-8)continue
   const count=Math.ceil(distance/.01),step=distance/count,diameter=Math.max(p.width,q.width)+step
   // Radius = trace radius + half sample spacing; the union covers the
   // entire original capsule, including its end lands, on its own layer.
   for(let k=0;k<=count;k++)wires.push({type:'rect',shape:'circle',center:{x:q.x+(p.x-q.x)*k/count,y:q.y+(p.y-q.y)*k/count},width:diameter,height:diameter,layers:[p.layer],connectedTo})
  }
 }
 assert.equal(vias.size,expectedThroughVias)
 input.obstacles.push(...vias.values(),...wires)
 return {input,addedThroughViaObstacles:vias.size,addedWireCapsuleObstacles:wires.length,conservativeWireSamplingPitchMm:reserveWireCapsules ? 0.01 : null}
}
