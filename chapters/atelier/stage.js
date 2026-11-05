import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {warmUp} from 'teardown-kit/warm.js';
import {createBombe} from './model.js';

export const CAMERAS={
  hero:{p:[2.3,2.15,4.65],t:[0,1.02,0]},
  front:{p:[0,1.15,4.8],t:[0,1.05,0]},
  back:{p:[-2.25,2.06,-4.65],t:[0,1.05,-.14]},
  detail:{p:[-.35,2.04,1.54],t:[-.53,1.59,.52]},
  motor:{p:[1.1,.95,1.7],t:[-.45,.37,0]},
  explode:{p:[4.15,3.04,6.2],t:[.23,1.11,.06]},
};
export function createStage(canvas){
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.VSMShadowMap;
  const scene=new T.Scene();scene.background=new T.Color('#eeede8');
  const camera=new T.PerspectiveCamera(34,1,.04,60);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.075;
  controls.minDistance=.45;controls.maxDistance=12;controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.12;controls.enablePan=true;
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();const env=pmrem.fromScene(room,.045);scene.environment=env.texture;scene.environmentIntensity=.75;room.dispose();pmrem.dispose();
  const hemi=new T.HemisphereLight('#fff6e3','#8f9498',1.15);scene.add(hemi);
  const key=new T.DirectionalLight('#fff5e3',2.6);key.position.set(-3.5,6,4);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=4;key.shadow.camera.bottom=-4;
  key.shadow.camera.near=.1;key.shadow.camera.far=16;key.shadow.normalBias=.008;key.shadow.bias=-.00012;key.shadow.radius=4;key.shadow.blurSamples=8;scene.add(key);
  const fill=new T.DirectionalLight('#dee9f8',1.4);fill.position.set(4,3,-4);scene.add(fill);
  const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.ShadowMaterial({color:'#343729',opacity:.14,polygonOffset:true,polygonOffsetFactor:-1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.017;floor.receiveShadow=true;scene.add(floor);
  const model=createBombe();scene.add(model.root);
  let target='hero',moving=true,manual=false;
  camera.position.set(...CAMERAS.hero.p);controls.target.set(...CAMERAS.hero.t);controls.update();
  controls.addEventListener('start',()=>{moving=false;manual=true;});
  let cp=new T.Vector3(...CAMERAS.hero.p),ct=new T.Vector3(...CAMERAS.hero.t);
  function setView(id,immediate=false){const spec=CAMERAS[id]||CAMERAS.hero;target=id;cp.set(...spec.p);ct.set(...spec.t);if(id!=='detail'&&id!=='motor')cp.sub(ct).multiplyScalar(Math.max(1,1.03/camera.aspect)).add(ct);moving=true;manual=false;if(immediate){camera.position.copy(cp);controls.target.copy(ct);controls.update();moving=false;}}
  function focusDrum(index,e){const p=model.positions[index];target='detail';ct.set(p.x,p.y,p.z+.08+e*1.15);cp.set(p.x+.18,p.y+.14,ct.z+.8);moving=true;manual=false;}
  function resize(){const r=canvas.parentElement.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(!manual)setView(target,true);}
  function frame(state,e,options,dt=1/60){
    model.update(state,e,options);
    if(moving){const k=options.reducedMotion?1:1-Math.exp(-dt*5.8);camera.position.lerp(cp,k);controls.target.lerp(ct,k);if(camera.position.distanceTo(cp)<.001)moving=false;}
    controls.update();renderer.render(scene,camera);
  }
  function selectDrum(x,y){const rect=canvas.getBoundingClientRect();const p=new T.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);const ray=new T.Raycaster();ray.setFromCamera(p,camera);const hit=ray.intersectObjects(model.templates.map(t=>t.mesh),false)[0];return hit?.instanceId??null;}
  function setQuality(low){renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.5));key.shadow.mapSize.set(low?1024:2048,low?1024:2048);key.shadow.map?.dispose();key.shadow.map=null;resize();}
  function screenshot(){return renderer.domElement.toDataURL('image/png');}
  function dispose(){controls.dispose();model.dispose();floor.geometry.dispose();floor.material.dispose();env.dispose();renderer.dispose();}
  resize();
  return {scene,camera,renderer,model,controls,frame,resize,setView,focusDrum,selectDrum,setQuality,screenshot,dispose,warm:()=>warmUp(renderer,camera,[{scene,target:null}]),get view(){return manual?'自由视角':target;}};
}
