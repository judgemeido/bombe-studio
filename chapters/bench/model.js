import * as T from 'three';
import {ALPHABET,ROTORS,REFLECTOR,TAU,CY,RADIUS,rotorX,reflectorX,boardX,segmentPaths,internalPoints} from './kinematics.js';

export function createBench(){
  const root=new T.Group(),rotors=[],shells=[],parts={rotor:new T.Group(),reflector:new T.Group(),wiring:new T.Group()};
  const materials={},geometries=new Set(),textures=new Set();
  const material=(name,color,metalness=.0,roughness=.57)=>materials[name]=new T.MeshStandardMaterial({color,metalness,roughness});
  const ink=material('ink','#343d37'),brass=material('brass','#b29d70',.72),metal=material('metal','#87918b',.76),bakelite=material('bakelite','#66564a',.15),base=material('base','#c6c9be',.45),copper=material('copper','#a88a61',.55),accent=material('accent','#4f7758',.3);
  const wireMat=new T.LineBasicMaterial({color:'#bba27d',transparent:true,opacity:.58});
  const hot=new T.MeshBasicMaterial({color:'#8ba14e'}),returnMat=new T.MeshBasicMaterial({color:'#b96638'});
  const signal=new T.Group(),chassis=new T.Group();root.add(...Object.values(parts),signal,chassis);
  function mesh(parent,geo,mat,pos=[0,0,0]){geometries.add(geo);const m=new T.Mesh(geo,mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(parent,size,pos,mat=metal){return mesh(parent,new T.BoxGeometry(...size),mat,pos);}
  function disk(parent,r,h,pos,mat){const m=mesh(parent,new T.CylinderGeometry(r,r,h,64),mat,pos);m.rotation.z=Math.PI/2;return m;}
  function ring(parent,r,t,pos,mat=brass){const m=mesh(parent,new T.TorusGeometry(r,t,8,80),mat,pos);m.rotation.y=Math.PI/2;return m;}
  function instances(parent,geo,mat,poses){geometries.add(geo);const m=new T.InstancedMesh(geo,mat,poses.length);const o=new T.Object3D();poses.forEach((p,i)=>{o.position.set(...p);o.updateMatrix();m.setMatrixAt(i,o.matrix);});m.castShadow=true;parent.add(m);return m;}
  function label(parent,text,pos,size=[.5,.2],color='#343d37',orient=false){const c=document.createElement('canvas');c.width=512;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font='500 78px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,80);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;textures.add(tex);const mat=new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,depthWrite:false});const m=mesh(parent,new T.PlaneGeometry(...size),mat,pos);if(orient)m.rotation.y=Math.PI/2;return m;}
  box(chassis,[8.9,.14,3.4],[0,.13,.3],base);box(chassis,[8.6,.07,3.15],[0,.24,.3],ink);
  for(const x of [-3.9,3.9])for(const z of [-.9,1.5])box(chassis,[.38,.12,.4],[x,.025,z],ink);
  for(const z of [-.83,.83])disk(chassis,.035,7.4,[0,.53,z],metal);
  label(chassis,'BOMBE / SIGNAL STUDY',[0,.28,1.84],[2.1,.18]);
  for(let i=0;i<3;i++){
    const carrier=new T.Group();parts.rotor.add(carrier);const g=new T.Group();carrier.add(g);rotors.push({carrier,g});
    disk(carrier,.13,.97,[0,CY,0],metal);box(carrier,[.26,.78,.34],[0,.72,0]);disk(carrier,.23,.15,[.42,CY,0],brass);
    g.position.y=CY;
    const shell=disk(g,.86,.51,[0,0,0],bakelite);shells.push(shell);
    const face=disk(g,.68,.04,[-.26,0,0],ink);shells.push(face);
    for(const x of [-.285,.285]){ring(g,.83,.045,[x,0,0]);ring(g,.49,.025,[x,0,0],metal);ring(g,.75,.016,[x,0,0],ink);}
    disk(g,.16,.66,[0,0,0],brass);
    const points=[],bolts=[],teeth=[];
    for(let n=0;n<26;n++){
      const a=n*TAU/26;for(const x of [-.31,.31])points.push([x,Math.cos(a)*RADIUS,Math.sin(a)*RADIUS]);
      const j=ALPHABET.indexOf(ROTORS[i].wiring[n]),b=j*TAU/26;
      const wirePoints=internalPoints([.3,CY+Math.cos(a)*RADIUS,Math.sin(a)*RADIUS],[-.3,CY+Math.cos(b)*RADIUS,Math.sin(b)*RADIUS]).map(p=>new T.Vector3(p[0],p[1]-CY,p[2]));
      const curve=new T.CatmullRomCurve3(wirePoints);
      const geo=new T.BufferGeometry().setFromPoints(curve.getPoints(22));geometries.add(geo);g.add(new T.Line(geo,wireMat));
    }
    for(let n=0;n<78;n++){const a=n*TAU/78;teeth.push([0,.879*Math.cos(a),.879*Math.sin(a)]);}
    for(let n=0;n<6;n++){const a=n*TAU/6;bolts.push([.33,.43*Math.cos(a),.43*Math.sin(a)]);}
    instances(g,new T.SphereGeometry(.034,8,6),brass,points);instances(g,new T.BoxGeometry(.15,.035,.035),metal,teeth);instances(g,new T.SphereGeometry(.043,8,6),metal,bolts);
    const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d');ctx.translate(512,512);ctx.font='bold 43px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#303930';
    for(let n=0;n<26;n++){const a=n*TAU/26;ctx.save();ctx.translate(-Math.sin(a)*444,-Math.cos(a)*444);ctx.rotate(-a);ctx.fillText(ALPHABET[n],0,0);ctx.restore();}
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;textures.add(tex);const m=mesh(g,new T.PlaneGeometry(1.88,1.88),new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,depthWrite:false}),[.345,0,0]);m.rotation.y=Math.PI/2;
    label(carrier,`${ROTORS[i].name} / ${['SLOW','MID','FAST'][i]}`,[0,.37,1.0],[1.1,.18]);
    box(carrier,[.13,.09,.2],[.3,CY+.98,0],accent);
  }
  const refl=parts.reflector;refl.position.y=CY;disk(refl,.88,.16,[0,0,0],ink);ring(refl,.84,.04,[.1,0,0]);disk(refl,.14,.23,[0,0,0],brass);box(refl,[.2,.85,.4],[0,-.77,0],metal);
  const rp=[];for(let n=0;n<26;n++){const a=n*TAU/26;rp.push([.13,RADIUS*Math.cos(a),RADIUS*Math.sin(a)]);const j=ALPHABET.indexOf(REFLECTOR[n]);if(j<n)continue;const b=j*TAU/26;const curve=new T.CatmullRomCurve3([new T.Vector3(...rp.at(-1)),new T.Vector3(.18,0,.05),new T.Vector3(.13,RADIUS*Math.cos(b),RADIUS*Math.sin(b))]);const geo=new T.BufferGeometry().setFromPoints(curve.getPoints(22));geometries.add(geo);refl.add(new T.Line(geo,wireMat));}instances(refl,new T.SphereGeometry(.036,8,6),brass,rp);label(refl,'UKW B',[0,-1.08,1],[.8,.2]);
  const board=parts.wiring;box(board,[1.55,1.06,.14],[0,1.09,1.57],ink);box(board,[1.68,.11,.42],[0,.5,1.55],metal);const holes=[];
  for(let n=0;n<26;n++){const x=-.54+(n%13)*.09,y=.91+Math.floor(n/13)*.37;holes.push([x,y,1.66]);}
  instances(board,new T.TorusGeometry(.033,.009,5,12),brass,holes);label(board,'A B C D E F G H I J K L M',[0,1.45,1.652],[1.22,.085],'#d6d6bf');label(board,'N O P Q R S T U V W X Y Z',[0,1.08,1.652],[1.22,.085],'#d6d6bf');label(board,'STECKER / I–O',[0,.6,1.79],[1.15,.14]);
  const jumper=new T.Group();board.add(jumper);let lastKey='',curves=[],signalMeshes=[];
  function clear(group){for(const c of [...group.children]){group.remove(c);c.geometry?.dispose();}}
  function tube(parent,points,r,mat){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(curve,48,r,6,false),mat);parent.add(m);return {curve,m};}
  const dot=mesh(root,new T.SphereGeometry(.065,12,8),hot);dot.visible=false;
  function update(state){
    const {positions,spread,cut,focus,trace,progress,pairs}=state;
    rotors.forEach(({carrier,g},i)=>{carrier.position.x=rotorX(i,spread);g.rotation.x=-positions[i]*TAU/26;});
    refl.position.x=reflectorX(spread);board.position.x=boardX(spread);shells.forEach(s=>s.visible=!cut);
    for(const [id,part]of Object.entries(parts))part.visible=!focus||id===focus;
    const key=JSON.stringify([trace,spread,pairs,focus]);
    if(key!==lastKey){lastKey=key;clear(signal);clear(jumper);curves=[];signalMeshes=[];
      for(const pair of pairs){const [a,b]=pair.map(c=>ALPHABET.indexOf(c));const p=n=>[-.54+(n%13)*.09,.91+Math.floor(n/13)*.37,1.73];const s=p(a),e=p(b);tube(jumper,[s,[s[0],s[1]-.23,2.03],[e[0],e[1]-.23,2.03],e],.026,accent);}
      if(trace)for(let i=0;i<9;i++){
        const curve=new T.CurvePath();for(const path of segmentPaths(trace,i,spread).slice(focus?1:0))curve.add(path.length===2?new T.LineCurve3(...path.map(p=>new T.Vector3(...p))):new T.CatmullRomCurve3(path.map(p=>new T.Vector3(...p))));
        const m=new T.Mesh(new T.TubeGeometry(curve,64,.022,6,false),i>4?returnMat:hot);m.userData.part=trace.stages[i].rotor!==null?'rotor':i===4?'reflector':'wiring';signal.add(m);curves.push(curve);signalMeshes.push(m);
      }
    }
    chassis.visible=!focus;dot.visible=!!trace&&progress>0&&(!focus||signalMeshes[Math.min(8,Math.floor(progress))]?.userData.part===focus);
    signalMeshes.forEach((m,i)=>{const f=Math.max(0,Math.min(1,progress-i));m.visible=f>0&&(!focus||m.userData.part===focus);m.geometry.setDrawRange(0,Math.floor(64*f)*6*6);});
    if(dot.visible){const i=Math.min(8,Math.floor(progress));dot.position.copy(curves[i].getPoint(Math.min(1,progress-i)));}
  }
  function bounds(focus){return new T.Box3().setFromObject(focus?parts[focus]:root);}
  function dispose(){clear(signal);clear(jumper);root.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});textures.forEach(t=>t.dispose());}
  return {root,parts,update,bounds,dispose};
}
