import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {routeGuardedOuterBridge as corrected} from './lib/am3352-fixed-fanout-terminal-bridge.mjs'
import {routeGuardedOuterBridge as previous} from './lib/am3352-fixed-fanout-outer-bridge.mjs'
import {routeSegments} from './lib/am3352-ddr-spacing-geometry.mjs'

// Synthetic geometry regression only; never imported into any circuit.
const connection={name:'selected',pointsToConnect:[{x:0,y:0,layer:'bottom'},{x:.9,y:0,layer:'bottom'}]},via={kind:'circle',x:0,y:0,w:.4572,h:.4572,hole:.254,layers:['top','bottom'],owner:'selected'},options={connection,shapes:[via],searchBounds:{minX:-1,maxX:1,minY:-1,maxY:1},seconds:1,gridMm:.02,maxVias:2,viaGrid:.02,overlapPenalty:.05}
const old=previous(options),fixed=corrected(options);assert(!old.route);assert(fixed.route);assert.equal(fixed.newVias,0);assert(Math.abs(fixed.lengthMm-.9)<1e-8)
const foreign={...via,x:.5,owner:'foreign'},around=corrected({...options,shapes:[via,foreign]});assert(around.route);assert.equal(around.newVias,0)
const distance=s=>{const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,t=Math.max(0,Math.min(1,((foreign.x-s.a.x)*dx+(foreign.y-s.a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(foreign.x-s.a.x-t*dx,foreign.y-s.a.y-t*dy)}
const gap=Math.min(...routeSegments('selected',around.route).map(distance))-.4572/2-.1016/2;assert(gap>=.1016-1e-8)
const wrongOwner=corrected({...options,shapes:[{...via,owner:'foreign'}]});assert(!wrongOwner.route)
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const report={status:'SELECTED_TERMINAL_VIA_GUARD_REGRESSION_PASS_SYNTHETIC_GEOMETRY_ONLY',correctedHelper:artifact('scripts/lib/am3352-fixed-fanout-terminal-bridge.mjs'),previousHelper:artifact('scripts/lib/am3352-fixed-fanout-outer-bridge.mjs'),sameNetTerminalViaCanExit:true,duplicateTerminalViaNotCreated:true,foreignViaClearanceEnforced:true,minimumForeignViaCopperGapMm:gap,foreignOwnedStartRemainsBlocked:true,pcbConnectivityOrFabricationQualification:false}
writeFileSync('checks/integrated/am3352-bottom-terminal-via-guard-regression.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
