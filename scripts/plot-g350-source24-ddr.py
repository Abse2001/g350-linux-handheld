"""Standalone engineering plot from verified JSON; no board SDK/CAD imports."""
from pathlib import Path
import hashlib,json,os
os.environ['MPLCONFIGDIR']='/tmp/g350-source24-matplotlib-cache'
os.environ['OPENBLAS_NUM_THREADS']='1'
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle,Rectangle

cad_path=Path('/tmp/g350-source24-cad-root-20261015-after46-earlytrap/output/kicad-source24-report.json')
assert hashlib.sha256(cad_path.read_bytes()).hexdigest()=='248b9750653fbbd880b82be5808b86bb420f9f19d0cb32b76e2bfc3a532a4ffa'
cad=json.loads(cad_path.read_bytes());assert cad['actual24PhysicalCpuRamGraphCount']==24 and cad['expectedMissingOriginalSignalCount']==25
paths=[Path('/tmp/g350-source24-core-root-20261015-0310/output/raw-core.json'),Path('/tmp/g350-source24-native-root-20261015-0324/output/native24-report.json'),Path('/tmp/g350-source24-api-root-20261015-0345/output/projection/GENUINE_CURRENT_CORE49_CONSTRUCTOR_INPUT.json')]
pins=['85c99a617ee1bbaeb88046e3ce37bfa420f86affb4dd897ef7db685ea72b72f0','601a7eadcf1fb773d3d457c614f61eee41f3de7969847171e817aa11487a347d','f0c49b1f37477658533607da2f52b473870f6d75d241a4556014913df429748a']
for p,h in zip(paths,pins):assert hashlib.sha256(p.read_bytes()).hexdigest()==h
raw,native,model=[json.loads(p.read_bytes())for p in paths]
carriers=native['actualOwnershipProof']['carriers'];selected={c['originalSourceTraceId']for c in carriers};owned={i for c in carriers for i in c['actualDirectPcbTraceIds']}
assert len(selected)==24 and len(model['connections'])==49
sources={r['source_component_id']:r for r in raw if r['type']=='source_component'}
fig,axes=plt.subplots(2,2,figsize=(14,12),facecolor='#101923')
for ax,(layer,color)in zip(axes.flat,[('top','#ff8383'),('inner1','#f2c96c'),('inner2','#78dbaf'),('bottom','#78b8ff')]):
    ax.set_facecolor('#152230');ax.set_aspect('equal');ax.set_xlim(-13,12);ax.set_ylim(2,28)
    ax.set_title(layer.upper(),color=color,fontsize=15,loc='left',pad=10)
    ax.tick_params(colors='#8fa4b8',labelsize=8)
    for spine in ax.spines.values():spine.set_color('#405267')
    for c in model['connections']:
        if c['name']not in selected:
            a,b=c['pointsToConnect'];ax.plot([a['x'],b['x']],[a['y'],b['y']],color='#b9c6d4',alpha=.23,linewidth=.5,linestyle=(0,(3,4)),zorder=1)
    for r in raw:
        if r['type']=='pcb_component':
            name=sources.get(r.get('source_component_id'),{}).get('name')
            if name not in('U_SOC','U_RAM'):continue
            x,y=r['center']['x'],r['center']['y'];w,h=r['width'],r['height']
            ax.add_patch(Rectangle((x-w/2,y-h/2),w,h,facecolor='#25364b',edgecolor='#9dacbc',linewidth=.7,alpha=.45,zorder=0))
            ax.text(x-w/2+.2,y+h/2-.5,name,color='#ced7e2',fontsize=9,zorder=10)
        elif r['type']=='pcb_trace':
            is_selected=r['pcb_trace_id']in owned
            for a,b in zip(r['route'],r['route'][1:]):
                if a['route_type']==b['route_type']=='wire'and a['layer']==b['layer']==layer:
                    ax.plot([a['x'],b['x']],[a['y'],b['y']],color=color if is_selected else '#8c9ba9',alpha=1 if is_selected else .23,linewidth=1.4 if is_selected else .65,solid_capstyle='round',zorder=3 if is_selected else 2)
        elif r['type']=='pcb_via':
            ax.add_patch(Circle((r['x'],r['y']),r['outer_diameter']/2,facecolor='#34584d',edgecolor='#b0cfb5',linewidth=.45,zorder=5))
            ax.add_patch(Circle((r['x'],r['y']),r['hole_diameter']/2,facecolor='#101923',edgecolor='none',zorder=6))
        elif layer=='top'and r['type']=='pcb_smtpad'and r.get('shape')=='circle':
            ax.add_patch(Circle((r['x'],r['y']),r['radius'],facecolor='#cfb779',alpha=.75,edgecolor='none',zorder=4))
    ax.set_xlabel('mm',color='#8fa4b8',fontsize=8)
fig.suptitle('G350 DDR — 24 / 49 verified DDR connections',color='#edf4fa',fontsize=21,y=.98)
fig.text(.5,.942,'Native clearance + solver API + fresh CLI export + KiCad connectivity passed',ha='center',color='#b6c7d8',fontsize=11)
fig.text(.5,.026,'Colored copper: selected DDR paths  |  Gray dashes: 25 missing requests  |  Not fabrication-ready',ha='center',color='#d6e1ec',fontsize=11)
fig.text(.5,.009,'Exact Core85c99a61 / Native601a7ead / model f0c49b1f · Reference planes, electrical timing and full-board DRC unqualified',ha='center',color='#91a6ba',fontsize=8)
fig.subplots_adjust(top=.91,bottom=.07,hspace=.19,wspace=.16)
output=Path('/tmp/g350-source24-ddr-four-layer-kicad-verified.png');assert not output.exists();fig.savefig(output,dpi=170,facecolor=fig.get_facecolor());plt.close(fig)
for p,h in zip(paths,pins):assert hashlib.sha256(p.read_bytes()).hexdigest()==h
print(json.dumps({'scope':'NON_BOARD_SDK_ENGINEERING_VISUALIZATION','path':str(output),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'bytes':output.stat().st_size,'boardSdkOrCadImported':False,'inputsHeld':True,'selected':24,'missing':25,'cadPending':False,'fabricationReady':False}))
