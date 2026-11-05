import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {warmUp} from '../kit/warm.js';
import {createBench} from './model.js';
export function createStage(canvas){
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  const scene=new T.Scene();scene.background=new T.Color('#eeede8');const camera=new T.PerspectiveCamera(32,1,.05,90);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.485;controls.minDistance=2;controls.maxDistance=35;
  const pm=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pm.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.7;room.dispose();pm.dispose();
  scene.add(new T.HemisphereLight('#fff5e6','#7c8278',1.4));const key=new T.DirectionalLight('#fff8e9',3);key.position.set(0,7,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-6,right:6,top:5,bottom:-5,near:.1,far:20});key.shadow.normalBias=.018;scene.add(key);
  const fill=new T.DirectionalLight('#e1e9ed',1.7);fill.position.set(-4,3,-4);scene.add(fill);
  const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.ShadowMaterial({opacity:.12,color:'#2b3528',polygonOffset:true,polygonOffsetFactor:-1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const model=createBench();scene.add(model.root);let view='overview',focus=null,lastState=null;
  function setView(id='overview',part=null){
    view=id;focus=part;const box=model.bounds(part),center=box.getCenter(new T.Vector3());
    const direction=(id==='front'?new T.Vector3(.3,3,13):id==='contacts'?new T.Vector3(10,4,4):new T.Vector3(8,5.8,12)).normalize();
    const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right).normalize();
    const tan=Math.tan(T.MathUtils.degToRad(camera.fov/2));let distance=2;
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
      const p=new T.Vector3(x,y,z).sub(center);distance=Math.max(distance,Math.abs(p.dot(right))/(tan*camera.aspect)+p.dot(direction),Math.abs(p.dot(up))/tan+p.dot(direction));
    }
    camera.position.copy(center).addScaledVector(direction,distance*1.0);controls.target.copy(center);controls.update();
  }
  function resize(){const r=canvas.parentElement.getBoundingClientRect();if(r.width<=0||r.height<=0)return;renderer.setSize(r.width,r.height,false);camera.aspect=Math.max(.1,r.width/r.height);camera.updateProjectionMatrix();setView(view,focus);if(lastState)frame(lastState);}
  const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);
  function frame(state){lastState=state;model.update(state);controls.update();renderer.render(scene,camera);}
  return {model,renderer,camera,controls,frame,setView,resize,warm:()=>warmUp(renderer,camera,[{scene,target:null}]),eco(value){renderer.setPixelRatio(value?1:Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=!value;resize();},snapshot:()=>canvas.toDataURL('image/png'),dispose(){observer.disconnect();controls.dispose();model.dispose();floor.geometry.dispose();floor.material.dispose();env.dispose();renderer.dispose();}};
}
