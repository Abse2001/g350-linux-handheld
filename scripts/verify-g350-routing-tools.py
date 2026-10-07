"""Exercise the compiled routing engine and record isolated tool versions."""
import hashlib,json,platform,subprocess,sys,tempfile
from pathlib import Path
sys.path.insert(0,str(Path('.cloud-tools/python-routing').resolve()))
import numpy as np
import scipy,shapely
assert (np.__version__,scipy.__version__,shapely.__version__)==('2.3.5','1.17.0','2.1.2')
root=Path('.cloud-tools/g350-grid-path').resolve()
reports=[]
with tempfile.TemporaryDirectory(prefix='g350-grid-smoke-',dir='/tmp') as tmp:
    p=Path(tmp)
    for name,block_corners,via_required in [('planar',False,False),('corner_cut_rejected',True,False),('layer_change',False,True)]:
        blocked=np.zeros((4,3,3),dtype=np.uint8);goal=np.zeros_like(blocked)
        via=np.zeros((3,3),dtype=np.uint8)
        if block_corners:
            blocked[1:]=1;blocked[0,0,1]=1;blocked[0,1,0]=1
        if via_required:via[0,0]=1
        goal[3 if via_required else 0,2,2]=1
        for filename,array in [('blocked',blocked),('goal',goal),('via',via)]:array.tofile(p/filename)
        result=subprocess.run([str(root),'3','3','0','0','0',str(p/'blocked'),str(p/'via'),str(p/'goal'),'2','0','0','-','64'],capture_output=True,text=True,check=True)
        if block_corners:assert result.stdout.startswith('NO_PATH')
        else:
            assert result.stdout.startswith('PATH')
            nodes=list(map(int,result.stdout.splitlines()[1].split()))
            assert nodes[0]==0 and nodes[-1]==(35 if via_required else 8)
            if via_required:assert any(a//9!=b//9 for a,b in zip(nodes,nodes[1:]))
        reports.append(dict(name=name,passed=True))
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
assert sha(root)==sha('.cloud-tools/g350-grid-negotiated-path')
report=dict(python=platform.python_version(),numpy=np.__version__,scipy=scipy.__version__,shapely=shapely.__version__,geos=shapely.geos_version_string,compiler=subprocess.check_output(['g++','--version'],text=True).splitlines()[0],sourceSha256=sha('scripts/g350-grid-path.cpp'),binarySha256=sha(root),wheelRequirementsSha256=sha('cloud/python-routing-requirements.txt'),tests=reports,boardRoutingQualified=False,fabricationReady=False)
Path('.cloud-tools/g350-routing-tools-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
