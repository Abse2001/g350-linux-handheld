"""Standalone engineering plot from verified JSON; no board SDK/CAD imports."""
from pathlib import Path
import hashlib,json,os
CAD71_REPORT_PIN={'path':'/tmp/g350-source32-cad-root-20261015-after70/output/kicad-source32-report.json','sha256':'3182ab17d4d91f26f0c1d0fc423957174d92f84e7e3298cffe3fdbd49cfdb510'}  # Authentic Root-collected CAD71.
assert isinstance(CAD71_REPORT_PIN,dict) and set(CAD71_REPORT_PIN)=={'path','sha256'},'Authentic collected CAD71 report pin required'
os.environ['MPLCONFIGDIR']='/tmp/g350-source32-matplotlib-cache'
os.environ['OPENBLAS_NUM_THREADS']='1'
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle,Rectangle

cad_path=Path(CAD71_REPORT_PIN['path'])
assert hashlib.sha256(cad_path.read_bytes()).hexdigest()==CAD71_REPORT_PIN['sha256']
cad=json.loads(cad_path.read_bytes());assert cad['passed']is cad['diagnosticCompleted']is True and cad['actual32PhysicalCpuRamGraphCount']==32 and cad['expectedMissingOriginalSignalCount']==17
paths=[Path('/tmp/g350-source32-three-stage-root-20261015-after66/core/output/raw-core.json'),Path('/tmp/g350-source32-native-root-20261015-after67/output/native32-report.json'),Path('/tmp/g350-source32-api-root-20261015-after68/projection/output/GENUINE_CURRENT_CORE49_CONSTRUCTOR_INPUT.json'),Path('/tmp/g350-source32-api-root-20261015-after68/api/output/actual-original-api32.json')]
pins=['8ff53b8f95e06f5323e324f146f6860c45f3dec2bf02ba308c6c0202671d1b03','4ebb7a8de36e934d6e0e1f45554453aefdb34eac498d76c4eb5ac17b75f6eaa2','a0cd7cf8c064b98389121cc7cfa61a40cef274b300db043bb36be025682b14b8','c66ded4ae5f54f6eea460de221480bb22c0421b623d8f83d20b223148569a39f']
for p,h in zip(paths,pins):assert hashlib.sha256(p.read_bytes()).hexdigest()==h
raw,native,model,api=[json.loads(p.read_bytes())for p in paths]
assert cad['actualCoreSha256']==native['actualCoreSha256']==api['actualCoreSha256']==pins[0] and api['actualNativeReportSha256']==pins[1]
assert api['original49Input']=={'path':str(paths[2]),'sha256':pins[2]} and api['allOriginalApiLoaded32ChecksPassed']is api['exactMaterialHeld']is True
assert api['actualCompleteOriginalSignalCount']==32 and api['expectedMissingOriginalSignalCount']==17 and cad['fabricationReady']is api['fabricationReady']is False
adoption_path=Path('/workspace/bus-lanes-solver/.cache/root-routing-progress/source32-PARTIAL32-ADOPTED-after67-68-69-70-71-root.json')
assert hashlib.sha256(adoption_path.read_bytes()).hexdigest()=='f2666dbc6db137ae3a5582a6e050d92e418cc0ef81c2f65e6df69ed299763a76'
adoption=json.loads(adoption_path.read_bytes());assert adoption['partialRoutingAdopted']is True and adoption['connectedOriginal49Signals']==32 and adoption['missingOriginal49Signals']==17 and adoption['fabricationReady']is False
carriers=native['actualOwnershipProof']['carriers'];selected={c['originalSourceTraceId']for c in carriers};owned={i for c in carriers for i in c['actualDirectPcbTraceIds']}
assert len(selected)==32 and len(model['connections'])==49
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
fig.suptitle('G350 DDR — 32 / 49 verified DDR connections (partial)',color='#edf4fa',fontsize=21,y=.98)
fig.text(.5,.942,'Native clearance + original solver API + fresh CLI export + KiCad connectivity passed',ha='center',color='#b6c7d8',fontsize=11)
fig.text(.5,.026,'Colored copper: selected DDR paths  |  Gray dashes: 17 missing requests  |  Partial snapshot  |  Not fabrication-ready',ha='center',color='#d6e1ec',fontsize=11)
fig.text(.5,.009,'Exact Core8ff53b8f / Native4ebb7a8d / APIc66ded4a / modela0cd7cf8 · Reference planes, electrical timing and full-board DRC unqualified',ha='center',color='#91a6ba',fontsize=8)
fig.subplots_adjust(top=.91,bottom=.07,hspace=.19,wspace=.16)
output=Path('/tmp/g350-source32-ddr-four-layer-kicad-verified.png');assert not output.exists();fig.savefig(output,dpi=170,facecolor=fig.get_facecolor());plt.close(fig)
for p,h in zip(paths,pins):assert hashlib.sha256(p.read_bytes()).hexdigest()==h
print(json.dumps({'scope':'NON_BOARD_SDK_ENGINEERING_VISUALIZATION','path':str(output),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'bytes':output.stat().st_size,'boardSdkOrCadImported':False,'inputsHeld':True,'selected':32,'missing':17,'cadPending':False,'fabricationReady':False}))
