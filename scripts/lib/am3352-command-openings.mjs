import assert from 'node:assert/strict'

// Exact diagnostic openings identified by actual reachable-boundary evidence.
// This never authorizes an arbitrary partial DDR phase or a fabrication pass.
export const commandAccessOpenings={
  'open-wen-rasn-odt':['DDR_WEn','DDR_RASn','DDR_ODT'],
  'open-six-command-barriers':['DDR_WEn','DDR_RASn','DDR_ODT','DDR_A7','DDR_CKE','DDR_CASn'],
}
export const assertDiagnosticCommandOpenings=names=>{
  assert(Array.isArray(names)&&new Set(names).size===names.length)
  const sorted=[...names].sort()
  assert(Object.values(commandAccessOpenings).some(candidate=>JSON.stringify([...candidate].sort())===JSON.stringify(sorted)),
    'Only the exact recorded command-access opening sets are allowed')
  return names.length
}
