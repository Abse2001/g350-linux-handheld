// Source checkouts are for inspection, never automatic runtime replacements.
import assert from 'node:assert/strict'
import {readFileSync,existsSync,mkdirSync,symlinkSync,lstatSync,readlinkSync,mkdtempSync,renameSync} from 'node:fs'
import {dirname,resolve} from 'node:path'
import {spawnSync} from 'node:child_process'
const manifest=JSON.parse(readFileSync('cloud/repositories.json','utf8'))
const base='.cloud-tools/upstreams'
const cache='.cloud-tools/upstream-inspection-cache'
mkdirSync(base,{recursive:true})
const run=(args,cwd)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']});assert.equal(r.status,0,r.stderr);return r.stdout.trim()}
const assertOrigin=(path,repo)=>assert.equal(run(['remote','get-url','origin'],path).replace(/\.git$/, ''),repo.repository,`Unexpected inspection origin ${path}`)
const assertPinned=(path,repo)=>{
 assert.equal(run(['rev-parse','HEAD'],path),repo.ref,`Preserve unexpected checkout ${path}`)
 assert.equal(run(['status','--porcelain'],path),'',`Preserve edits in ${path}`)
}
const assertOwnedCache=path=>{
 for(const directory of [path,`${path}/.git`,`${path}/.git/objects`])assert(lstatSync(directory,{throwIfNoEntry:false})?.isDirectory(),`Preserve unknown inspection cache ${directory}`)
 assert.equal(run(['rev-parse','--absolute-git-dir'],path),resolve(path,'.git'))
 assert.equal(run(['rev-parse','--path-format=absolute','--git-common-dir'],path),resolve(path,'.git'))
 assert.equal(run(['rev-parse','--show-toplevel'],path),path)
 assert(!lstatSync(`${path}/.git/objects/info/alternates`,{throwIfNoEntry:false}),`Preserve borrowed inspection objects ${path}`)
}
// A developer checkout is not the pinned inspection workspace. Clone Git
// objects without sharing its worktree/index or borrowing collectible objects.
const pinnedCopy=(repo,attached)=>{
 const path=resolve(cache,`${repo.name}-${repo.ref}`)
 if(!lstatSync(path,{throwIfNoEntry:false})){
  mkdirSync(cache,{recursive:true})
  const temporary=mkdtempSync(resolve(cache,`${repo.name}-${repo.ref}.`))
  if(existsSync(attached)){
   assertOrigin(attached,repo)
   run(['clone','--no-checkout','--local','--dissociate',attached,temporary],'.')
   run(['remote','set-url','origin',repo.repository],temporary)
  }else{
   run(['init','--quiet'],temporary)
   run(['remote','add','origin',repo.repository],temporary)
  }
  const available=spawnSync('git',['cat-file','-e',`${repo.ref}^{commit}`],{cwd:temporary,stdio:'ignore'}).status===0
  if(!available)run(['fetch','--depth=1','origin',repo.ref],temporary)
  run(['checkout','--detach',repo.ref],temporary)
  assertOwnedCache(temporary);assertOrigin(temporary,repo);assertPinned(temporary,repo)
  assert(!lstatSync(path,{throwIfNoEntry:false}),`Preserve newly appeared inspection cache ${path}`)
  renameSync(temporary,path)
 }
 assertOwnedCache(path)
 assertOrigin(path,repo);assertPinned(path,repo)
 assert.equal(run(['branch','--show-current'],path),'',`Preserve inspection branch ${path}`)
 return path
}
for(const repo of manifest.upstreams){
 assert(/^[a-z0-9-]+$/.test(repo.name));assert(/^[0-9a-f]{40}$/.test(repo.ref))
 const path=`${base}/${repo.name}`
 const attached=resolve('/workspace',repo.name)
 const cached=resolve(cache,`${repo.name}-${repo.ref}`)
 const entry=lstatSync(path,{throwIfNoEntry:false})
 const target=entry?.isSymbolicLink()?resolve(dirname(path),readlinkSync(path)):undefined
 if(!entry||target===attached){
  let inspection
  if(existsSync(attached)){
   assertOrigin(attached,repo)
   const reusable=run(['rev-parse','HEAD'],attached)===repo.ref&&run(['branch','--show-current'],attached)===''&&run(['status','--porcelain'],attached)===''
   inspection=reusable?attached:pinnedCopy(repo,attached)
  }else inspection=pinnedCopy(repo,attached)
  if(!entry)symlinkSync(inspection,path,'dir')
  else if(target!==inspection){
   // Only replace our known attached link, after the exact pinned copy passes.
   const current=lstatSync(path,{throwIfNoEntry:false})
   const currentTarget=current?.isSymbolicLink()?resolve(dirname(path),readlinkSync(path)):undefined
   assert(currentTarget===attached||currentTarget===inspection,`Preserve changed inspection link ${path}`)
   if(currentTarget!==inspection){
    const next=`${path}.next-${process.pid}`
    symlinkSync(inspection,next,'dir');renameSync(next,path)
   }
  }
 }else if(target===cached){
  // Reconstruct a missing ignored cache without changing the developer repo.
  pinnedCopy(repo,attached)
 }
 assertPinned(path,repo)
 console.log(`${repo.name}: ${repo.ref}`)
}
