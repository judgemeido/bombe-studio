import React, { useEffect, useMemo } from 'react';
import { AbsoluteFill, Composition, interpolate, registerRoot, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useFrame, useThree } from '@react-three/fiber';
import { createMissionModel } from '../../../src/mission-model.js';

const palette = { ink: '#efe6d2', brass: '#d2b384', sea: '#122731', mist: '#a9c1c0' };
const RAILS = {
  entry: { camera: [-18, 6.2, 12.5], target: [-12.8, 1.5, -1.6] },
  radio: { camera: [-10.2, 3.8, 7.2], target: [-8.1, 1.25, -1.2] },
  archive: { camera: [-1.8, 4.4, 7.2], target: [0, 1.35, -.15] },
  analysis: { camera: [8.8, 4.5, 6.8], target: [7.3, 1.35, -.2] },
  machine: { camera: [16.5, 4.8, 6.6], target: [14.2, 1.65, -.8] },
  map: { camera: [11.5, 5.3, -7.5], target: [8.9, 1.45, -6.2] },
  handoff: { camera: [-1.5, 4.6, -8.8], target: [-1.4, 1.45, -8.1] },
};

function CameraRail({ zone, frame }) {
  const { camera } = useThree();
  useFrame(() => {
    const rail = RAILS[zone] || RAILS.archive;
    const opening = zone === 'entry' ? Math.min(1, frame / 240) : 1;
    const cameraPosition = rail.camera.map((value, index) => value + (index === 1 ? 1.2 : 2.4) * (1 - opening));
    camera.position.set(...cameraPosition);
    camera.lookAt(...rail.target);
  });
  return null;
}

function Scene({ frame, zone = 'entry', mode = 'quiet' }) {
  const model = useMemo(() => createMissionModel(), []);
  useEffect(() => () => model.dispose(), [model]);
  const positions = mode === 'search' ? [1, 3, Math.floor(frame / 3) % 26] : [1, 3, 5];
  model.setZone?.(zone);
  model.update({ stage: mode === 'search' ? 9 : 0, beat: mode === 'search' ? 9 : 0, channel: 1, pair: 'A', positions }, frame / 24, { reduced: true, searchProgress: mode === 'search' ? frame : null });
  return <><CameraRail zone={zone} frame={frame} /><primitive object={model.root} /></>;
}

function FrameOverlay({ eyebrow, title, body, progress = 0 }) {
  return <>
    <AbsoluteFill style={{ background: 'linear-gradient(90deg,#0b1d27ee 0%,#0b1d27b8 38%,transparent 82%)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', inset: 42, border: '1px solid #80958e55', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', left: 76, top: 70, color: palette.brass, fontFamily: 'Consolas, monospace', fontSize: 15, letterSpacing: 3 }}>{eyebrow}</div>
    <div style={{ position: 'absolute', left: 76, top: 178, width: 530, color: palette.ink }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 66, lineHeight: 1.18, letterSpacing: 3 }}>{title}</div>
      <div style={{ marginTop: 28, color: palette.mist, fontFamily: '"Microsoft YaHei", sans-serif', fontSize: 21, lineHeight: 1.8 }}>{body}</div>
    </div>
    <div style={{ position: 'absolute', left: 76, right: 76, bottom: 62, height: 2, background: '#80958e55' }}>
      <div style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%`, height: '100%', background: palette.brass }} />
    </div>
  </>;
}

function Prologue() {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig();
  const camera = interpolate(frame, [0, 240], [12, 7.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ background: palette.sea, color: palette.ink, fontFamily: 'Georgia, serif' }}>
    <ThreeCanvas width={width} height={height} camera={{ position: [camera * .55, 5, camera], fov: 38 }} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={[palette.sea]} />
      <ambientLight intensity={1.8} /><directionalLight position={[-4, 8, 5]} intensity={2.8} color="#ffe4bc" /><directionalLight position={[4, 3, -2]} intensity={1.4} color="#9dc5d5" />
      <Scene frame={frame} zone="entry" />
    </ThreeCanvas>
    <FrameOverlay eyebrow="1941 / NIGHT SHIFT" title="黎明之前" body={<>雾把北港藏在黑暗里。<br />接班的人已经坐下，截报正在等待判断。</>} progress={frame / 240} />
  </AbsoluteFill>;
}

function ZoneTransit() {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig();
  const phase = frame < 72 ? 'radio' : frame < 144 ? 'machine' : 'map';
  const camera = interpolate(frame, [0, 168], [9, 6.2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ background: palette.sea, color: palette.ink }}>
    <ThreeCanvas width={width} height={height} camera={{ position: [camera * .7, 4.2, camera], fov: 42 }} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={[palette.sea]} />
      <ambientLight intensity={1.7} /><directionalLight position={[-5, 7, 5]} intensity={2.4} color="#f5d8aa" /><directionalLight position={[4, 2, -4]} intensity={1.2} color="#88aeb9" />
      <Scene frame={frame} zone={phase} mode={phase === 'machine' ? 'search' : 'quiet'} />
    </ThreeCanvas>
    <FrameOverlay eyebrow="FIELD NOTE / MOVE WITH THE EVIDENCE" title={phase === 'radio' ? '截收室' : phase === 'machine' ? '机房' : '地图室'} body={phase === 'radio' ? '重复的格式从噪声里浮出来。' : phase === 'machine' ? '鼓轮开始转动，停机结果还不能直接放行。' : '文字终于落到北港的航线和时间上。'} progress={frame / 168} />
  </AbsoluteFill>;
}

function Handoff() {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig();
  const fade = interpolate(frame, [0, 22, 158, 180], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ background: '#0d202b', color: palette.ink }}>
    <ThreeCanvas width={width} height={height} camera={{ position: [7.2, 4.8, 8.4], fov: 40 }} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={['#0d202b']} />
      <ambientLight intensity={1.7} /><directionalLight position={[-3, 7, 6]} intensity={2.8} color="#ffe4bc" /><directionalLight position={[4, 3, -2]} intensity={1.2} color="#a2c8d9" />
      <Scene frame={frame} zone="handoff" />
    </ThreeCanvas>
    <AbsoluteFill style={{ background: 'linear-gradient(90deg,#0d202bf5 0%,#0d202bc7 36%,transparent 82%)', opacity: fade }} />
    <div style={{ position: 'absolute', left: 76, top: 72, color: palette.brass, fontFamily: 'Consolas, monospace', fontSize: 15, letterSpacing: 3, opacity: fade }}>HANDOFF / 05:50</div>
    <div style={{ position: 'absolute', left: 76, top: 178, color: palette.ink, opacity: fade }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 61, lineHeight: 1.2 }}>把明文和未知<br />一起交出去。</div>
      <div style={{ marginTop: 28, color: palette.mist, fontFamily: '"Microsoft YaHei", sans-serif', fontSize: 21, lineHeight: 1.8 }}>DX / WETTER NORDHAFEN FREI<br />05:42 的窗口，确认前暂缓放行。</div>
    </div>
  </AbsoluteFill>;
}

registerRoot(() => <>
  <Composition id="Prologue" component={Prologue} durationInFrames={240} fps={24} width={1280} height={720} />
  <Composition id="ZoneTransit" component={ZoneTransit} durationInFrames={168} fps={24} width={1280} height={720} />
  <Composition id="Handoff" component={Handoff} durationInFrames={180} fps={24} width={1280} height={720} />
</>);
