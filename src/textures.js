import * as THREE from 'three';
import { EXHIBIT_PALETTE as P } from './exhibit-palette.js';
function texture(width, height, paint, data = false) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; paint(canvas.getContext('2d'));
  const result = new THREE.CanvasTexture(canvas); result.colorSpace = data ? THREE.NoColorSpace : THREE.SRGBColorSpace; result.anisotropy = 8; return result;
}
export function createTextures() {
  const drum = texture(1024, 1024, c => {
    c.fillStyle = '#b8a888'; c.fillRect(0, 0, 1024, 1024);
    const disc = (r, color) => { c.beginPath(); c.arc(512, 512, r, 0, Math.PI * 2); c.fillStyle = color; c.fill(); };
    disc(501, '#e7e0ce'); disc(381, '#7b725f'); disc(374, '#b7ad94');
    c.strokeStyle = '#8f8268'; c.lineWidth = 2;
    for (const r of [495, 387, 343, 287]) { c.beginPath(); c.arc(512, 512, r, 0, Math.PI * 2); c.stroke(); }
    // Letters occupy the face annulus, not the hub. Deterministic, restrained
    // machining marks avoid adding sparkling noise at overview scale.
    for (let r = 165; r < 372; r += 5) { c.beginPath(); c.strokeStyle = r % 2 ? '#b0a58d' : '#bdb39a'; c.arc(512, 512, r, 0, Math.PI * 2); c.stroke(); }
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * Math.PI * 2; c.save(); c.translate(512, 512); c.rotate(a);
      c.font = '600 48px Consolas, monospace'; c.fillStyle = '#302f2b'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String.fromCharCode(65 + i), 0, -431);
      // Alternating long and short graduations make each letter position
      // inspectable while retaining the restrained engraved-instrument look.
      c.strokeStyle = i % 5 === 0 ? '#514d41' : '#817762';
      c.lineWidth = i % 5 === 0 ? 4 : 2;
      c.beginPath(); c.moveTo(0, i % 5 === 0 ? -458 : -468); c.lineTo(0, -485); c.stroke();
      c.fillStyle = '#635a49'; c.beginPath(); c.arc(0, -319, 8, 0, Math.PI * 2); c.fill(); c.restore();
    }
    disc(152, P.edge);
  });
  const plaque = texture(1024, 160, c => {
    c.fillStyle = P.brass; c.fillRect(0, 0, 1024, 160); c.strokeStyle = P.bronze; c.lineWidth = 5; c.strokeRect(9, 9, 1006, 142);
    c.fillStyle = P.sea; c.textAlign = 'center'; c.font = 'bold 36px Georgia'; c.fillText('BRITISH TABULATING MACHINE Co.', 512, 71); c.font = '20px monospace'; c.fillText('TURING–WELCHMAN / BOMBE', 512, 117);
  });
  const paint = texture(256, 256, c => {
    c.fillStyle = '#f4f4f4'; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5000; i++) { c.fillStyle = i % 3 ? 'rgba(35,54,65,.018)' : 'rgba(255,255,255,.09)'; c.fillRect((i * 53.321) % 256, (i * 37.231) % 256, 1, 2); }
  });
  paint.wrapS = paint.wrapT = THREE.RepeatWrapping; paint.repeat.set(3, 3);
  const metal = texture(256, 256, c => {
    c.fillStyle = '#eeeeeb'; c.fillRect(0, 0, 256, 256);
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
  const paintBump = texture(256, 256, c => {
    c.fillStyle = '#808080'; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 12000; i++) {
      const v = 110 + i % 35; c.fillStyle = `rgb(${v},${v},${v})`;
      c.fillRect((i * 53.321) % 256, (i * 37.231) % 256, 1, 1);
    }
  }, true);
  paintBump.wrapS = paintBump.wrapT = THREE.RepeatWrapping; paintBump.repeat.set(4, 4);
  const metalRoughness = texture(256, 256, c => {
    c.fillStyle = '#a6a6a6'; c.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y++) { const v = 155 + (y * 17 % 31); c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(0, y, 256, 1); }
  }, true);
  metalRoughness.wrapS = metalRoughness.wrapT = THREE.RepeatWrapping; metalRoughness.repeat.set(2, 3);
  const bankScale = texture(2048, 64, c => {
    c.fillStyle = '#182b35'; c.fillRect(0, 0, 2048, 64);
    c.strokeStyle = '#776b52'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 2); c.lineTo(2048, 2); c.stroke();
    c.fillStyle = '#cbbb97'; c.font = '26px Consolas, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i < 12; i++) c.fillText(String(i + 1).padStart(2, '0'), (i + .5) * 2048 / 12, 35);
  });
  return { drum, rotorFace: drum, plaque, paint, metal, paintBump, metalRoughness, bankScale };
}
