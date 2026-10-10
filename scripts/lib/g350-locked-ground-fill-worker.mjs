// One checked fill per worker so Manifold's heap is reclaimed on exit.
import assert from 'node:assert/strict'
import {isMainThread,parentPort,workerData} from 'node:worker_threads'
import {fillG350LockedGround} from './g350-locked-ground-fill.mjs'
assert(!isMainThread&&parentPort&&Array.isArray(workerData?.input))
assert.equal(process.env.G350_GROUND_FILL_ISOLATED_WORKER,'0')
parentPort.postMessage(await fillG350LockedGround(workerData.input))
parentPort.close()
