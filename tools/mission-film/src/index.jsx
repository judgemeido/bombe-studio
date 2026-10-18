import React, { useEffect, useMemo } from 'react';
import { AbsoluteFill, Composition, interpolate, registerRoot, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { createMissionModel } from '../../../src/mission-model.js';

function Room({ frame }) {
  const model = useMemo(() => createMissionModel(), []);
  useEffect(() => () => model.dispose(), [model]);
  model.update({ stage: 4, channel: 1, pair: 'A', positions: [1, 3, Math.floor(frame / 5) % 26] }, frame / 24, { reduced: true });
  model.drums.forEach((drum, i) => { drum.rotation.z = -frame / 24 * (2 + i % 3); });
  return <primitive object={model.root} />;
}
const fade = (frame, from, to) => interpolate(frame, [from, to], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
function Arrival() {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig();
  const approach = interpolate(frame, [0, 288], [9.5, 7], { extrapolateRight: 'clamp' });
  const titleAlpha = fade(frame, 66, 96), finalAlpha = fade(frame, 198, 222);
  return <AbsoluteFill style={{ background:'#122731', color:'#efe6d2', fontFamily:'Georgia, "Microsoft YaHei", serif' }}>
    <ThreeCanvas width={width} height={height} camera={{ position:[approach*.6,4.8,approach], fov:39 }} gl={{ antialias:true, alpha:false }}>
      <color attach="background" args={['#122731']} />
      <ambientLight intensity={1.9}/><directionalLight position={[-3,7,6]} intensity={3} color="#ffe4bc"/><directionalLight position={[4,3,-2]} intensity={1.5} color="#a2c8d9"/>
      <group position={[2.3,-.3,-.2]} rotation={[0,-.14,0]}><Room frame={frame}/></group>
    </ThreeCanvas>
    <AbsoluteFill style={{ background:'linear-gradient(90deg,#0d202bf5 0%,#0d202bc4 34%,transparent 80%)' }}/>
    <div style={{ position:'absolute', inset:43, border:'1px solid #80958e55', pointerEvents:'none' }}/>
    <div style={{ position:'absolute',left:76,top:73,fontFamily:'Consolas,monospace',fontSize:17,letterSpacing:4,color:'#c9a77a' }}>04 / BEFORE DAYBREAK</div>
    <div style={{position:'absolute',left:76,top:174,opacity:1-titleAlpha,transform:`translateY(${frame*.12}px)`}}>
      <div style={{fontSize:20,color:'#b4c4c7',letterSpacing:5}}>一封截报，越过时间。</div>
      <div style={{fontSize:76,letterSpacing:7,marginTop:25}}>2026 → 1941</div>
    </div>
    <div style={{position:'absolute',left:76,top:173,opacity:titleAlpha}}>
      <div style={{fontSize:19,letterSpacing:5,color:'#b4c4c7'}}>英国 · 布莱切利园</div>
      <div style={{fontSize:80,lineHeight:1.5,letterSpacing:8,marginTop:22}}>黎明之前</div>
      <div style={{fontSize:28,fontStyle:'italic',color:'#c6bda5'}}>Before daybreak.</div>
      <div style={{fontFamily:'"Microsoft YaHei",sans-serif',fontSize:23,lineHeight:1.8,marginTop:48,opacity:fade(frame,110,136)}}>图灵先生，截报刚刚送到。<br/>你的第一条线索，藏在噪声里。</div>
    </div>
    <div style={{position:'absolute',left:76,bottom:78,fontFamily:'"Microsoft YaHei",sans-serif',fontSize:16,color:'#d2b384',opacity:finalAlpha}}>七次推理 · 一条证据链 · 从这里开始 →</div>
    <div style={{position:'absolute',right:66,bottom:65,fontFamily:'"Microsoft YaHei",sans-serif',fontSize:11,color:'#afc1c0'}}>原创教学情境 / 三维结构重建</div>
    <AbsoluteFill style={{background:'#122731',opacity:1-fade(frame,0,15)}}/>
  </AbsoluteFill>;
}
registerRoot(() => <Composition id="Arrival" component={Arrival} durationInFrames={288} fps={24} width={1280} height={720}/>);
