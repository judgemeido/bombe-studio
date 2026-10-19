import * as THREE from 'three';
import { EXHIBIT_PALETTE as P } from './exhibit-palette.js';
function texture(width, height, paint) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; paint(canvas.getContext('2d'));
  const result = new THREE.CanvasTexture(canvas); result.colorSpace = THREE.SRGBColorSpace; result.anisotropy = 4; return result;
}
export function createTextures() {
  const drum = texture(512, 512, c => {
    c.fillStyle = P.paper; c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2000; i++) { c.fillStyle = i % 2 ? '#dedace' : '#fbfaf5'; c.fillRect((i * 107.39) % 512, (i * 37.73) % 512, 1, 1); }
    c.strokeStyle = P.brass; c.lineWidth = 2;
    for (const r of [221, 178, 116]) { c.beginPath(); c.arc(256, 256, r, 0, Math.PI * 2); c.stroke(); }
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * Math.PI * 2; c.save(); c.translate(256, 256); c.rotate(a); c.font = '18px Georgia'; c.fillStyle = P.ink; c.textAlign = 'center'; c.fillText(String.fromCharCode(65 + i), 0, -190); c.restore();
      c.beginPath(); c.fillStyle = P.edge; c.arc(256 + Math.sin(a) * 148, 256 - Math.cos(a) * 148, 9, 0, Math.PI * 2); c.fill();
    }
    c.beginPath(); c.arc(256, 256, 67, 0, Math.PI * 2); c.fillStyle = P.edge; c.fill();
  });
  const plaque = texture(1024, 160, c => {
    c.fillStyle = P.brass; c.fillRect(0, 0, 1024, 160); c.strokeStyle = P.bronze; c.lineWidth = 5; c.strokeRect(9, 9, 1006, 142);
    c.fillStyle = P.sea; c.textAlign = 'center'; c.font = 'bold 36px Georgia'; c.fillText('BRITISH TABULATING MACHINE Co.', 512, 71); c.font = '20px monospace'; c.fillText('TURING–WELCHMAN / BOMBE', 512, 117);
  });
  const paint = texture(256, 256, c => {
    c.fillStyle = P.mist; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5000; i++) { c.fillStyle = i % 3 ? 'rgba(35,54,65,.025)' : 'rgba(255,255,255,.12)'; c.fillRect((i * 53.321) % 256, (i * 37.231) % 256, 1, 2); }
  });
  paint.wrapS = paint.wrapT = THREE.RepeatWrapping; paint.repeat.set(3, 3);
  const metal = texture(256, 256, c => {
    c.fillStyle = '#bfc8c8'; c.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 3) {
      const alpha = .035 + ((y * 17) % 11) / 260;
      c.fillStyle = `rgba(35,54,65,${alpha.toFixed(3)})`; c.fillRect(0, y, 256, 1);
    }
    for (let i = 0; i < 160; i++) {
      c.fillStyle = i % 3 ? 'rgba(255,255,255,.08)' : 'rgba(35,54,65,.07)';
      c.fillRect((i * 71.3) % 256, (i * 43.7) % 256, 1 + (i % 3), 1);
    }
  });
  metal.wrapS = metal.wrapT = THREE.RepeatWrapping; metal.repeat.set(2, 3);
  return { drum, rotorFace: drum, plaque, paint, metal };
}
