"""Standalone engineering plot from verified JSON; no board SDK/CAD imports."""
from pathlib import Path
import hashlib,json,os
CAD60_REPORT_PIN={'path':'/tmp/g350-source29-cad-root-20261015-after59/output/kicad-source29-report.json','sha256':'08fc1078ac6ba2d4b8b89f64ff58ed27429f8ebe32e683b49322e69c825eb305'}  # Authentic Root-collected CAD60.
assert isinstance(CAD60_REPORT_PIN,dict) and set(CAD60_REPORT_PIN)=={'path','sha256'},'Authentic collected CAD60 report pin required'
os.environ['MPLCONFIGDIR']='/tmp/g350-source29-matplotlib-cache'
os.environ['OPENBLAS_NUM_THREADS']='1'
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle,Rectangle

cad_path=Path(CAD60_REPORT_PIN['path'])
assert hashlib.sha256(cad_path.read_bytes()).hexdigest()==CAD60_REPORT_PIN['sha256']
cad=json.loads(cad_path.read_bytes());assert cad['passed']is cad['diagnosticCompleted']is True and cad['actual29PhysicalCpuRamGraphCount']==29 and cad['expectedMissingOriginalSignalCount']==20
paths=[Path('/tmp/g350-source29-three-stage-root-20261015-after52/core/output/raw-core.json'),Path('/tmp/g350-source29-native-root-20261015-after53/output/native29-report.json'),Path('/tmp/g350-source29-api-root-20261015-after54/projection/output/GENUINE_CURRENT_CORE49_CONSTRUCTOR_INPUT.json'),Path('/tmp/g350-source29-api-root-20261015-after54/api/output/actual-original-api29.json')]
pins=['bf98e35f464bee13d60fa413f3055af178f2d50735bbeef9a891672ba8fa4e37','b64da2caabd897511dcb67116d7a1f8249d90214a72a13b461f13ccd4015d025','f3043009084ee9dd37a4c9bb0e66dc9c79618ea385fa55741a98b7921065d9e3','88b8b2a4d5c148c2207b798cd520462e26e923fc9837ceeba35912e16076180c']
for p,h in zip(paths,pins):assert hashlib.sha256(p.read_bytes()).hexdigest()==h
raw,native,model,api=[json.loads(p.read_bytes())for p in paths]
assert cad['actualCoreSha256']==native['actualCoreSha256']==api['actualCoreSha256']==pins[0] and api['actualNativeReportSha256']==pins[1]
assert api['original49Input']=={'path':str(paths[2]),'sha256':pins[2]} and api['allOriginalApiLoaded26ChecksPassed']is api['exactMaterialHeld']is True
assert api['actualCompleteOriginalSignalCount']==29 and api['expectedMissingOriginalSignalCount']==20 and cad['fabricationReady']is api['fabricationReady']is False
carriers=native['actualOwnershipProof']['carriers'];selected={c['originalSourceTraceId']for c in carriers};owned={i for c in carriers for i in c['actualDirectPcbTraceIds']}
assert len(selected)==29 and len(model['connections'])==49
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
fig.suptitle('G350 DDR — 29 / 49 verified DDR connections (partial)',color='#edf4fa',fontsize=21,y=.98)
fig.text(.5,.942,'Native clearance + original solver API + fresh CLI export + KiCad connectivity passed',ha='center',color='#b6c7d8',fontsize=11)
fig.text(.5,.026,'Colored copper: selected DDR paths  |  Gray dashes: 20 missing requests  |  Partial snapshot  |  Not fabrication-ready',ha='center',color='#d6e1ec',fontsize=11)
fig.text(.5,.009,'Exact Corebf98e35f / Nativeb64da2ca / API88b8b2a4 / modelf3043009 · Reference planes, electrical timing and full-board DRC unqualified',ha='center',color='#91a6ba',fontsize=8)
fig.subplots_adjust(top=.91,bottom=.07,hspace=.19,wspace=.16)
output=Path('/tmp/g350-source29-ddr-four-layer-kicad-verified.png');assert not output.exists();fig.savefig(output,dpi=170,facecolor=fig.get_facecolor());plt.close(fig)
for p,h in zip(paths,pins):assert hashlib.sha256(p.read_bytes()).hexdigest()==h
print(json.dumps({'scope':'NON_BOARD_SDK_ENGINEERING_VISUALIZATION','path':str(output),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'bytes':output.stat().st_size,'boardSdkOrCadImported':False,'inputsHeld':True,'selected':29,'missing':20,'cadPending':False,'fabricationReady':False}))
