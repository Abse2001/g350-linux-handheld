export function canonicalMemoryInput(value:unknown):unknown {
  if(Array.isArray(value))return value.map(canonicalMemoryInput)
  if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value)
    .sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonicalMemoryInput(item)]))
  return value
}
export async function memoryInputFingerprint(value:unknown) {
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(canonicalMemoryInput(value))))
  return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("")
}
