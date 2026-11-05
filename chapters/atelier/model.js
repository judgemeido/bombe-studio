import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {D, COUNT, TAU, drumPositions} from './kinematics.js';

function canvasTexture(draw, size=512) {
  const c=document.createElement('canvas'); c.width=c.height=size;
  draw(c.getContext('2d'),size); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; t.anisotropy=8; return t;
}
function noiseTexture() {
  return canvasTexture((c,s)=>{ c.fillStyle='#bababa';c.fillRect(0,0,s,s);let seed=13847;
    for(let i=0;i<18000;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%s;seed=(seed*1664525+1013904223)>>>0;const y=seed%s;c.fillStyle=`rgba(40,40,40,${.03+(i%8)*.012})`;c.fillRect(x,y,1,1);}
  },256);
}
export function createBombe() {
  const root=new T.Group();root.name='Turing–Welchman Bombe';
  const groups={}; for(const id of ['frame','drums','drive','wiring','motor']){const g=new T.Group();g.name=id;g.userData.part=id;root.add(g);groups[id]=g;}
  const ownedG=new Set(), ownedM=new Set(), ownedT=new Set(), batches=new Map();
  const grain=noiseTexture(); grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(6,6);ownedT.add(grain);
  const mat=(p)=>{const m=new T.MeshStandardMaterial(p);ownedM.add(m);return m;};
  const M={
    enamel:mat({color:'#752d2d',metalness:.36,roughness:.46,bumpMap:grain,bumpScale:.0011}),
    edge:mat({color:'#321c1c',metalness:.5,roughness:.46}),
    steel:mat({color:'#a0a5a0',metalness:.82,roughness:.36,bumpMap:grain,bumpScale:.00035}),
    brass:mat({color:'#ad8d49',metalness:.78,roughness:.38}),
    dark:mat({color:'#262b2c',metalness:.5,roughness:.48}),
    rubber:mat({color:'#1d2020',roughness:.87}),
    bakelite:mat({color:'#33251e',roughness:.57,metalness:.1}),
    red:mat({color:'#9d3b31',metalness:.25,roughness:.4}),
    green:mat({color:'#345e4c',metalness:.3,roughness:.42}),
    amber:mat({color:'#b89b53',metalness:.38,roughness:.4}),
    cable:mat({color:'#514536',roughness:.78}),
    active:mat({color:'#d6923f',emissive:'#c57724',emissiveIntensity:.3,roughness:.43}),
    cream:mat({color:'#e5d8b5',roughness:.58}),
  };
  const track=g=>{ownedG.add(g);return g;};
  function mesh(g,geo,m,pos=[0,0,0],rot=[0,0,0]){track(geo);const ob=new T.Mesh(geo,m);ob.position.set(...pos);ob.rotation.set(...rot);ob.castShadow=ob.receiveShadow=true;g.add(ob);return ob;}
  function batch(g,geo,m,pos=[0,0,0],rot=[0,0,0]){
    if(geo.index){const old=geo;geo=old.toNonIndexed();old.dispose();}
    geo.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...pos),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(1,1,1)));
    const key=g.uuid+m.uuid;if(!batches.has(key))batches.set(key,{g,m,geos:[]});batches.get(key).geos.push(geo);
  }
  function box(g,size,m,pos,bevel=.006,rot=[0,0,0]){batch(g,new RoundedBoxGeometry(...size,2,Math.min(bevel,Math.min(...size)/3)),m,pos,rot);}
  function cyl(g,r,h,m,pos,rot=[Math.PI/2,0,0],segments=24){batch(g,new T.CylinderGeometry(r,r,h,segments),m,pos,rot);}
  function torus(g,r,tube,m,pos,rot=[0,0,0],segments=40){batch(g,new T.TorusGeometry(r,tube,6,segments),m,pos,rot);}
  function screw(g,pos,rot=[0,0,0],r=.006){cyl(g,r,.004,M.steel,pos,[Math.PI/2+rot[0],rot[1],rot[2]],12);box(g,[r*1.4,.0012,.001],M.dark,[pos[0],pos[1],pos[2]+.0023],.0002,rot);}
  function wire(g,pts,r=.004,m=M.cable){const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));batch(g,new T.TubeGeometry(curve,32,r,6,false),m);return curve;}
  function plaque(g,text,pos,w=.3,h=.055,color='#d7c59d',rot=[0,0,0]) {
    const tex=canvasTexture((c,s)=>{c.canvas.height=128;c.fillStyle=color;c.fillRect(0,0,s,128);c.strokeStyle='#514837';c.lineWidth=2;c.strokeRect(4,4,s-8,120);c.fillStyle='#292b27';c.textAlign='center';c.textBaseline='middle';let size=56;c.font=`bold ${size}px Georgia`;while(c.measureText(text).width>s-24){size-=1;c.font=`bold ${size}px Georgia`;}c.fillText(text,s/2,65);});ownedT.add(tex);
    const m=mat({color:'#ffffff',map:tex,metalness:.35,roughness:.6});mesh(g,new T.PlaneGeometry(w,h),m,pos,rot);
  }
  const {frame,drums,drive,wiring,motor}=groups;
  // Frame is structural. Removable panels are independent, with deliberate explosion paths.
  const panels=[new T.Group(),new T.Group(),new T.Group()];panels.forEach(g=>frame.add(g));
  box(frame,[2.4,.14,.8],M.enamel,[0,.12,0],.016);
  box(frame,[2.34,.038,.77],M.dark,[0,.205,0]);
  for(const x of [-1.16,1.16])for(const z of [-.34,.32]){
    box(frame,[.064,1.85,.065],M.enamel,[x,1.08,z]);
    for(const y of [.36,.92,1.48,1.96])screw(frame,[x,y,z+.034],undefined,.008);
  }
  for(const y of [.29,.85,1.39,1.92])for(const z of [-.34,.32])box(frame,[2.28,.038,.055],M.edge,[0,y,z]);
  for(const x of [-1.16,1.16])for(const y of [.33,1.01,1.89])box(frame,[.046,.045,.68],M.steel,[x,y,0]);
  panels.slice(0,2).forEach((g,i)=>{
    const sign=i===0?-1:1,x=sign*1.19;
    box(g,[.027,1.76,.696],M.enamel,[x,1.095,0],.009);
    box(g,[.006,1.6,.59],M.edge,[x+sign*.016,1.1,0],.003);
    box(g,[.008,1.585,.577],M.enamel,[x+sign*.021,1.1,0],.003);
    for(let k=0;k<16;k++)box(g,[.008,.009,.25],M.dark,[x+sign*.028,1.53+k*.019,-.05],.0015);
    for(const y of [.52,1.66]){cyl(g,.012,.09,M.steel,[x+sign*.026,y,-.28],[0,0,0]);box(g,[.016,.11,.048],M.steel,[x,y,-.265]);}
    box(g,[.02,.11,.13],M.dark,[x+sign*.03,1.01,.16]);
    for(const z of [.105,.215])cyl(g,.013,.034,M.steel,[x+sign*.055,1.01,z],[0,0,Math.PI/2]);
    box(g,[.025,.028,.11],M.steel,[x+sign*.079,1.01,.16]);
    for(const y of [.29,1.9])for(const z of [-.28,.28])cyl(g,.008,.008,M.steel,[x+sign*.03,y,z],[0,0,Math.PI/2],12);
  });
  box(panels[2],[2.4,.065,.74],M.enamel,[0,2.003,0],.012);
  for(let k=0;k<50;k++)box(panels[2],[.014,.003,.24],M.dark,[-1.035+k*.042,2.037,-.03],.001);
  box(frame,[2.29,.102,.045],M.enamel,[0,1.944,.385],.004);
  plaque(frame,'B T M   •   B O M B E',[0,1.948,.411],.6,.062);
  plaque(frame,'SERIAL  No.  001',[-.93,1.946,.411],.23,.045);
  for(const x of [-.34,.34])screw(frame,[x,1.948,.417]);
  for(const x of [-.98,.98])for(const z of [-.25,.25]){
    box(frame,[.1,.047,.1],M.steel,[x,.058,z]);
    cyl(frame,.04,.043,M.rubber,[x,.03,z],[0,0,Math.PI/2]);
    cyl(frame,.014,.05,M.steel,[x,.03,z],[0,0,Math.PI/2],16);
  }
  const lampMat=mat({color:'#d9b657',emissive:'#c3852e',emissiveIntensity:.35,roughness:.24});
  for(let k=0;k<3;k++){
    const x=.81+k*.087;cyl(frame,.022,.016,M.dark,[x,1.946,.416]);
    mesh(frame,new T.SphereGeometry(.015,16,10),lampMat,[x,1.946,.43]);
  }
  // Dense multi-layer drums. Geometry is shared and instanced across all 108 drums.
  const positions=drumPositions(), templates=[];
  const carrier=new T.Group();drums.add(carrier);
  for(let b=0;b<3;b++){
    const cy=1.76-b*D.bankPitch-D.pitchY;
    box(carrier,[2.22,.508,.045],M.bakelite,[0,cy,.327],.004);
    for(const x of [-1.105,1.105])box(carrier,[.016,.51,.048],M.steel,[x,cy,.326]);
    for(let c=0;c<12;c++){
      const x=(c-5.5)*D.pitchX;
      box(carrier,[.114,.468,.016],M.steel,[x,cy,.355],.003);
      for(const y of [cy-.218,cy+.218])screw(carrier,[x,y,.368]);
      plaque(carrier,String(c+1).padStart(2,'0'),[x,cy+.255,.354],.049,.02);
    }
    plaque(frame,['BANK A','BANK B','BANK C'][b],[-1.115,cy,.397],.09,.032,[undefined][0]||'#d7c59d');
  }
  function template(geo,m,z,layer=0,colors=false){track(geo);const im=new T.InstancedMesh(geo,m,COUNT);im.castShadow=im.receiveShadow=true;drums.add(im);im.userData={part:'drums'};
    templates.push({mesh:im,z,layer});if(colors)positions.forEach((p,i)=>im.setColorAt(i,new T.Color(['#a84b3e','#c4a75b','#47705a'][p.row])));return im;
  }
  const body=new T.LatheGeometry([[.024,-.042],[.067,-.042],[.071,-.038],[.071,-.032],[.074,-.029],[.074,.027],[.07,.031],[.07,.037],[.062,.037],[.062,.034]].map(a=>new T.Vector2(...a)),64);body.rotateX(Math.PI/2);
  template(body,mat({color:'#ffffff',roughness:.42,metalness:.34,bumpMap:grain,bumpScale:.0004}),.049,.14,true);
  template(new T.TorusGeometry(.071,.0023,6,72),M.brass,.084,.14);
  template(new T.TorusGeometry(.070,.002,6,72),M.steel,.011,.06);
  const face=new T.Shape();face.absarc(0,0,.057,0,TAU,false);
  for(let j=0;j<6;j++){const a=j*TAU/6,h=new T.Path();h.absarc(Math.sin(a)*.035,Math.cos(a)*.035,.0069,0,TAU,true);face.holes.push(h);}
  const centerHole=new T.Path();centerHole.absarc(0,0,.016,0,TAU,true);face.holes.push(centerHole);
  const faceGeo=new T.ExtrudeGeometry(face,{depth:.005,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.0007,bevelThickness:.0007,curveSegments:24});
  template(faceGeo,M.steel,.089,.23);
  const alphabet=canvasTexture((c,s)=>{
    c.clearRect(0,0,s,s);c.fillStyle='#eee3bc';c.textAlign='center';c.textBaseline='middle';
    for(let j=0;j<26;j++){const a=j*TAU/26;c.save();c.translate(s/2,s/2);c.rotate(a);c.font='bold 22px Georgia';c.fillText(String.fromCharCode(65+j),0,-s*.452);c.fillRect(-.7,-s*.404,1.4,7);c.restore();}
  },512);ownedT.add(alphabet);
  template(new T.RingGeometry(.058,.074,104),mat({map:alphabet,transparent:true,depthWrite:false,roughness:.6,metalness:.1,side:T.DoubleSide}),.091,.23);
  const hub=new T.CylinderGeometry(.017,.021,.025,32);hub.rotateX(Math.PI/2);template(hub,M.brass,.103,.28);
  const latchGeo=new RoundedBoxGeometry(.012,.07,.009,2,.003);latchGeo.rotateZ(-.25);template(latchGeo,M.steel,.119,.32);
  template(new T.TorusGeometry(.012,.002,6,24),M.brass,.125,.33);
  const pinG=new T.CylinderGeometry(.004,.004,.006,12);pinG.rotateX(Math.PI/2);pinG.translate(.013,.013,0);template(pinG,M.dark,.13,.33);
  const rearHub=new T.CylinderGeometry(.027,.027,.025,28);rearHub.rotateX(Math.PI/2);template(rearHub,M.bakelite,-.018,0);
  // 26 brass brush contacts on the rear of each drum, one shared instance geometry.
  const brushGeos=[];
  for(let j=0;j<26;j++){const a=j*TAU/26;const g=new T.BoxGeometry(.002,.009,.004);g.translate(0,.052,0);g.rotateZ(a);brushGeos.push(g);}
  template(mergeGeometries(brushGeos),M.brass,-.039,0);brushGeos.forEach(g=>g.dispose());
  for(const p of positions){
    cyl(carrier,.012,.07,M.steel,[p.x,p.y,.38]);
    box(carrier,[.008,.019,.006],M.cream,[p.x,p.y+.079,.399],.001);
  }
  // The removable back patch board has three labelled banks, cable looms and a diagonal matrix.
  const board=new T.Group();wiring.add(board);
  for(let b=0;b<3;b++){
    const y=1.605-b*.534;
    box(board,[2.13,.466,.038],M.bakelite,[0,y,-.366]);
    for(let c=0;c<12;c++)for(let r=0;r<3;r++){
      const x=(c-5.5)*.169,py=y+(r-1)*.12;
      cyl(board,.013,.008,M.brass,[x,py,-.393]);cyl(board,.008,.012,M.dark,[x,py,-.399]);
      for(let q=0;q<3;q++)cyl(board,.0019,.003,M.brass,[x+(q-1)*.004,py,-.407],undefined,8);
    }
    plaque(board,`MENU ${String.fromCharCode(65+b)}   /   01—12`,[0,y+.205,-.391],.62,.03,'#baa67e',[0,Math.PI,0]);
    for(let c=0;c<11;c++){
      const x=(c-5.5)*.169,next=(c-4.5)*.169;
      const pts=[[x,y+.12,-.42],[x-.018,y+.03,-.49],[x+.07,y-.06-(c%3)*.026,-.52],[next,y-.01,-.43]];
      wire(board,pts,.0045,c===4&&b===0?M.active:M.cable);
      for(const p of [pts[0],pts[3]]){cyl(board,.016,.03,M.rubber,p);cyl(board,.012,.015,M.brass,[p[0],p[1],p[2]-.025]);}
    }
  }
  const diagonal=new T.Group();board.add(diagonal);diagonal.position.set(1.025,1.12,-.44);diagonal.rotation.y=-Math.PI/2;
  box(diagonal,[.52,.54,.024],M.bakelite,[0,0,0]);
  for(let a=0;a<26;a++)for(let b=0;b<26;b++)cyl(diagonal,.003,.006,a===b?M.brass:M.steel,[(a-12.5)*.0175,(b-12.5)*.018,.019],undefined,6);
  plaque(diagonal,'DIAGONAL BOARD',[0,.301,.016],.49,.035);
  for(const y of [.41,.97,1.5])wire(board,[[1.0,y,-.43],[1.06,y-.055,-.49],[1.04,y+.04,-.55],[1.025,1.12,-.66]],.009,M.rubber);
  // Rear transmission: real geometry teeth, bearing blocks, vertical shafts and oil lines.
  function gearGeometry(r,teeth=28){
    const s=new T.Shape();for(let j=0;j<teeth*4;j++){const a=j/(teeth*4)*TAU,rr=r*(j%4===0||j%4===3?.9:1);const x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(j===0)s.moveTo(x,y);else s.lineTo(x,y);}s.closePath();
    const h=new T.Path();h.absarc(0,0,r*.22,0,TAU,true);s.holes.push(h);
    return new T.ExtrudeGeometry(s,{depth:.012,bevelEnabled:true,bevelSize:.0008,bevelThickness:.0008,bevelSegments:1,curveSegments:16});
  }
  const gears=[];const gearGeo=track(gearGeometry(.043,24));
  for(let b=0;b<3;b++){
    const y=1.855-b*.534;
    cyl(drive,.012,2.13,M.steel,[0,y,-.045],[0,0,Math.PI/2]);
    for(let c=0;c<12;c++){
      const x=(c-5.5)*D.pitchX;
      cyl(drive,.009,.405,M.steel,[x,y-.18,.015],[0,0,0]);
      box(drive,[.093,.435,.017],M.steel,[x,y-.19,.059]);
      for(let r=0;r<3;r++){
        const py=1.76-b*.534-r*.167;
        cyl(drive,.017,.293,M.steel,[x,py,.188]);
        box(drive,[.047,.047,.024],M.dark,[x,py,.06]);
        torus(drive,.019,.003,M.brass,[x,py,.078]);
        for(const dx of [-.019,.019])screw(drive,[x+dx,py+.017,.082],undefined,.003);
      }
      const ge=new T.Mesh(gearGeo,M.brass);ge.position.set(x,y-.04,-.014);ge.castShadow=true;drive.add(ge);gears.push({mesh:ge,row:b,phase:c*.2});
      cyl(drive,.013,.027,M.steel,[x,y-.04,.014]);
    }
    for(const x of [-1.04,-.51,0,.51,1.04]){box(drive,[.06,.068,.065],M.dark,[x,y,-.045]);cyl(drive,.019,.067,M.brass,[x,y,-.045],[0,0,Math.PI/2]);}
  }
  for(const x of [-1.065,1.065]){
    cyl(drive,.016,1.7,M.steel,[x,1.03,-.16],[0,0,0]);
    for(const y of [.37,.9,1.44,1.86]){box(drive,[.065,.09,.065],M.dark,[x,y,-.16]);cyl(drive,.024,.098,M.brass,[x,y,-.16],[0,0,0]);}
    wire(drive,[[x,1.89,.03],[x-.04,1.77,.12],[x-.035,1.02,.12],[x,.35,.015]],.003,M.brass);
  }
  // Motor, finned housing, turned endcaps, fan grille, copper windings and drive belt.
  box(motor,[.68,.035,.43],M.steel,[-.52,.231,-.015]);
  for(const x of [-.78,-.28])for(const z of [-.16,.16]){box(motor,[.07,.032,.08],M.dark,[x,.264,z]);screw(motor,[x,.282,z],undefined,.006);}
  cyl(motor,.105,.4,M.dark,[-.53,.366,.025],[0,0,Math.PI/2],48);
  for(let f=0;f<25;f++)torus(motor,.106,.0045,M.steel,[-.72+f*.016,.366,.025],[0,Math.PI/2,0],48);
  for(const x of [-.754,-.308]){cyl(motor,.094,.036,M.enamel,[x,.366,.025],[0,0,Math.PI/2],40);cyl(motor,.042,.046,M.steel,[x,.366,.025],[0,0,Math.PI/2]);}
  box(motor,[.13,.07,.11],M.dark,[-.56,.495,.025]);plaque(motor,'BTM  /  MOTOR',[-.54,.377,.137],.23,.055);
  cyl(motor,.017,.7,M.steel,[-.56,.366,.025],[0,0,Math.PI/2]);
  const flywheel=new T.Group();motor.add(flywheel);flywheel.position.set(-.15,.366,.025);flywheel.rotation.y=Math.PI/2;
  torus(flywheel,.087,.011,M.dark,[0,0,0]);cyl(flywheel,.029,.032,M.brass,[0,0,0]);
  for(let i=0;i<6;i++)box(flywheel,[.014,.142,.016],M.steel,[0,0,0],.002,[0,0,i*Math.PI/3]);
  const drivenPulley=new T.Group();motor.add(drivenPulley);drivenPulley.position.set(-.147,.505,-.112);drivenPulley.rotation.y=Math.PI/2;
  torus(drivenPulley,.061,.006,M.dark,[0,0,0]);cyl(drivenPulley,.017,.025,M.brass,[0,0,0]);
  for(let i=0;i<4;i++)box(drivenPulley,[.008,.108,.01],M.steel,[0,0,0],.002,[0,0,i*Math.PI/4]);
  cyl(motor,.009,.16,M.steel,[-.18,.505,-.112],[0,0,Math.PI/2]);
  box(motor,[.025,.26,.047],M.dark,[-.227,.37,-.112]);
  wire(motor,[[-.147,.279,.025],[-.147,.32,-.135],[-.147,.52,-.18],[-.147,.566,-.12],[-.147,.48,-.026],[-.147,.38,.111],[-.147,.279,.025]],.008,M.rubber);
  for(let i=0;i<8;i++)torus(motor,.055,.002,M.brass,[-.795-i*.003,.366,.025],[0,Math.PI/2,0]);
  wire(motor,[[-.56,.519,.07],[-.59,.55,-.07],[-.84,.29,-.2],[-1.08,.29,-.26]],.01,M.rubber);
  // Operator switches are attached to the fixed lower cross rail.
  box(frame,[2.22,.086,.08],M.edge,[0,.255,.37]);
  for(let c=0;c<12;c++){
    const x=(c-5.5)*D.pitchX;cyl(frame,.022,.024,M.bakelite,[x,.259,.424]);torus(frame,.023,.002,M.brass,[x,.259,.439]);box(frame,[.003,.018,.003],M.cream,[x,.266,.444],.0005);
  }
  // Finalize all static batches. Shared drum meshes are the only large dynamic buffers.
  for(const {g,m,geos} of batches.values()){const geo=mergeGeometries(geos);geos.forEach(v=>v.dispose());mesh(g,geo,m);}
  const pointer=mesh(drums,new T.TorusGeometry(.082,.002,8,80),M.active,[positions[0].x,positions[0].y,.57]);pointer.visible=false;pointer.castShadow=false;
  motor.scale.setScalar(.78);
  const matrix=new T.Matrix4(),q=new T.Quaternion(),axis=new T.Vector3(0,0,1),scale=new T.Vector3(1,1,1),v=new T.Vector3();
  let lastAngles='',lastExplode=-1;
  function update(state,e,{shell=false,part=null,isolate=false,selected=0}={}){
    drums.position.z=e*.9;carrier.position.z=e*.12;wiring.position.z=-e*1.1;
    const phase=(a,b)=>Math.max(0,Math.min(1,(e-a)/(b-a)));
    motor.position.set(1.7*phase(.65,1),.04+.18*phase(0,.2),-.12+.86*phase(.2,.65));
    panels[0].position.x=-e*.48;panels[1].position.x=e*.48;panels[2].position.y=e*.42;
    panels.forEach(p=>p.visible=!shell);
    for(const [id,g] of Object.entries(groups))g.visible=!isolate||id===part;
    if(part==='drive'&&!isolate)wiring.visible=false;
    const key=state.angles.join(',');
    if(key!==lastAngles||Math.abs(e-lastExplode)>.00001){
      for(const layer of templates){positions.forEach((p,i)=>{q.setFromAxisAngle(axis,state.angles[p.row]);v.set(p.x,p.y,p.z+layer.z+e*layer.layer);matrix.compose(v,q,scale);layer.mesh.setMatrixAt(i,matrix);});layer.mesh.instanceMatrix.needsUpdate=true;layer.mesh.computeBoundingSphere();}
      lastAngles=key;lastExplode=e;
    }
    for(const g of gears)g.mesh.rotation.z=state.angles[2]+g.phase;
    flywheel.rotation.z=state.angles[2]*1.5;drivenPulley.rotation.z=state.angles[2]*1.5*(.087/.061);
    lampMat.emissiveIntensity=.25+.22*(state.n%2);
    const p=positions[selected];pointer.position.set(p.x,p.y,p.z+.142+e*.35);pointer.visible=part==='drums';
  }
  function dispose(){ownedG.forEach(v=>v.dispose());ownedM.forEach(v=>v.dispose());ownedT.forEach(v=>v.dispose());}
  update({angles:[0,0,0],n:0},0);
  return {root,groups,panels,templates,positions,update,dispose,metrics:{drums:COUNT,contacts:COUNT*26,diagonalContacts:26*26}};
}
