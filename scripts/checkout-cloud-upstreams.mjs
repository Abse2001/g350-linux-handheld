// Source checkouts are for inspection, never automatic runtime replacements.
import assert from 'node:assert/strict'
import {readFileSync,existsSync,mkdirSync,symlinkSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
const manifest=JSON.parse(readFileSync('cloud/repositories.json','utf8'))
const base='.cloud-tools/upstreams'
mkdirSync(base,{recursive:true})
const run=(args,cwd)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']});assert.equal(r.status,0,r.stderr);return r.stdout.trim()}
for(const repo of manifest.upstreams){
 assert(/^[a-z0-9-]+$/.test(repo.name));assert(/^[0-9a-f]{40}$/.test(repo.ref))
 const path=`${base}/${repo.name}`
 if(!existsSync(path)){
  const attached=`/workspace/${repo.name}`
  if(existsSync(attached)){
   assert.equal(run(['remote','get-url','origin'],attached).replace(/\.git$/, ''),repo.repository,`Unexpected attached origin ${attached}`)
   assert.equal(run(['status','--porcelain'],attached),'',`Preserve edits in ${attached}`)
   run(['fetch','--depth=1','origin',repo.ref],attached)
   run(['checkout','--detach',repo.ref],attached)
   symlinkSync(attached,path,'dir')
  }else{
  mkdirSync(path);run(['init','--quiet'],path)
  run(['remote','add','origin',repo.repository],path)
  run(['fetch','--depth=1','origin',repo.ref],path)
  run(['checkout','--detach','FETCH_HEAD'],path)
  }
 }
 assert.equal(run(['rev-parse','HEAD'],path),repo.ref,`Preserve unexpected checkout ${path}`)
 assert.equal(run(['status','--porcelain'],path),'',`Preserve edits in ${path}`)
 console.log(`${repo.name}: ${repo.ref}`)
}
