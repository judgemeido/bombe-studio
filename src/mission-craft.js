import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Locally authored surface maps; no image downloads or runtime asset requests. */
function surface(kind) {
  const size = 256, pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4, noise = ((x * 73 + y * 179 + x * y * 13) % 251) / 251;
    const grain = Math.sin(y * .8 + Math.sin(x * .035) * 1.4 + Math.sin(y * .095) * 4);
    const v = kind === 'wood' ? .72 + grain * .14 + noise * .1 : .86 + noise * .14;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = Math.round(v * 255); pixels[i + 3] = 255;
  }
  const map = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.magFilter = THREE.LinearFilter;
  map.minFilter = THREE.LinearMipmapLinearFilter; map.generateMipmaps = true;
  map.repeat.set(kind === 'wood' ? 2 : 4, kind === 'wood' ? 2 : 4); map.needsUpdate = true;
  return map;
}

export function createMissionCraft(labelTexture) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), cache = new Map(), labelCache = new Map();
  const glyphs = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ...Array.from({ length: 26 }, (_, i) => String(i + 1).padStart(2, '0'))];
  const geometry = (key, factory) => { if (!cache.has(key)) { const g = factory(); cache.set(key, g); geometries.add(g); } return cache.get(key); };
  const woodMap = surface('wood'), grain = surface('paint'); textures.add(woodMap); textures.add(grain);
  function material(color, roughness = .6, metalness = 0, finish = '') {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    if (finish) { m.map = finish === 'wood' ? woodMap : grain; m.bumpMap = m.map; m.bumpScale = finish === 'wood' ? .012 : .0025; }
    materials.add(m); return m;
  }
  function mesh(g, mat, pos, parent, name = '') {
    geometries.add(g); materials.add(mat);
    const m = new THREE.Mesh(g, mat); m.position.set(...pos); m.name = name;
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(size, pos, mat, parent, radius = 0, name = '') {
    return mesh(geometry(`b:${size}:${radius}`, () => radius ? new RoundedBoxGeometry(...size, 2, radius) : new THREE.BoxGeometry(...size)), mat, pos, parent, name);
  }
  function cylinder(r, h, pos, mat, parent, segments = 32) {
    return mesh(geometry(`c:${r}:${h}:${segments}`, () => new THREE.CylinderGeometry(r, r, h, segments)), mat, pos, parent);
  }
  function ring(r, tube, pos, mat, parent) {
    return mesh(geometry(`r:${r}:${tube}`, () => new THREE.TorusGeometry(r, tube, 8, 40)), mat, pos, parent);
  }
  function cable(points, radius, mat, parent) {
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 48, radius, 8, false), mat, [0, 0, 0], parent);
  }
  function text(content, width, height, pos, parent, { flat = false, color = '#d6ceaf', background = '#172024', circle = false, name = '' } = {}) {
    const glyph = glyphs.indexOf(content), atlased = glyph >= 0;
    const key = `${atlased ? 'glyph-atlas' : content}:${color}:${background}`;
    if (!labelCache.has(key)) {
      const map = labelTexture?.(content, color, background, atlased ? glyphs : null); if (map) textures.add(map);
      const mat = new THREE.MeshStandardMaterial({ map: map || null, color: map ? '#ffffff' : background, roughness: .67 });
      materials.add(mat); labelCache.set(key, mat);
    }
    const g = geometry(`label:${circle}:${width}:${height}:${atlased ? glyph : ''}`, () => {
      const result = circle ? new THREE.CircleGeometry(width / 2, 32) : new THREE.PlaneGeometry(width, height);
      if (atlased) {
        const uv = result.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + glyph % 8) / 8, (uv.getY(i) + 7 - Math.floor(glyph / 8)) / 8);
      }
      return result;
    });
    const m = mesh(g, labelCache.get(key), pos, parent, name); m.castShadow = false;
    if (flat) m.rotation.x = -Math.PI / 2; return m;
  }
  function screw(x, y, z, mat, slotMat, parent, flat = false, r = .016) {
    const head = cylinder(r, .012, [x, y, z], mat, parent, 12);
    const slot = box([r * 1.25, .003, .0035], [x, y + .007, z], slotMat, parent);
    if (!flat) { head.rotation.x = Math.PI / 2; slot.position.set(x, y, z + .007); }
  }
  function batch(parent) {
    for (const child of [...parent.children]) if (child.isGroup) batch(child);
    const buckets = new Map();
    for (const child of parent.children) {
      if (!child.isMesh || child.name || child.userData.dynamic || !child.visible) continue;
      if (!buckets.has(child.material)) buckets.set(child.material, []);
      buckets.get(child.material).push(child);
    }
    for (const [mat, objects] of buckets) {
      if (objects.length < 2) continue;
      const parts = objects.map(o => { o.updateMatrix(); return o.geometry.clone().applyMatrix4(o.matrix); });
      // RoundedBoxGeometry is non-indexed; normalise the other primitives before combining.
      const compatible = parts.map(g => { if (!g.index) return g; const n = g.toNonIndexed(); g.dispose(); return n; });
      const merged = mergeGeometries(compatible); compatible.forEach(g => g.dispose());
      if (!merged) continue;
      objects.forEach(o => parent.remove(o)); mesh(merged, mat, [0, 0, 0], parent);
    }
  }
  let disposed = false;
  return { material, mesh, box, cylinder, ring, cable, text, screw, batch,
    dispose() {
      if (disposed) return; disposed = true;
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
    },
  };
}
