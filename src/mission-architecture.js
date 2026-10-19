import * as THREE from 'three';
import { MISSION_WORLD_LAYOUT as layout } from './mission-world-layout.js';

/** A continuous floor, with real openings and a deliberate roof/side-wall cutaway. */
export function createMissionArchitecture(craft, root, mats) {
  const { box, cylinder, text, material } = craft;
  const { walnut, wood, brass, steel } = mats;
  const zones = [], anchors = {}, portals = [], architectureWalls = [], practicals = [];
  const rearFacades = {}, boundaryFrames = {};
  const floor = material('#574938', .86, 0, 'wood');
  const floorAlt = material('#62513d', .84, 0, 'wood');
  const trim = material('#343f38', .66, .08, 'paint');
  const glass = material('#718f9a', .31, .16);
  glass.emissive.set('#7593a0'); glass.emissiveIntensity = .42;
  const warm = material('#ffe0a2', .35); warm.emissive.set('#ffc778'); warm.emissiveIntensity = 1.1;
  function group(name, pos, parent = root) {
    const g = new THREE.Group(); g.name = name; g.position.set(...pos); parent.add(g); return g;
  }
  function solid(name, size, pos, mat, parent) {
    const o = box(size, pos, mat, parent, .012, name); architectureWalls.push(o); return o;
  }
  function frame(name, position, parent, width = 2.6, rotated = false, cutaway = false) {
    const g = group(name, position, parent); g.userData.passable = true;
    if (rotated) g.rotation.y = Math.PI / 2;
    for (const x of [-width / 2, width / 2]) box([.14, 3.05, .23], [x, 1.23, 0], walnut, g, .013);
    box([width + .26, .16, .25], [0, 2.8, 0], wood, g, .012);
    // Camera-facing frames are cut away with the roof. Side and rear frames
    // remain visible and the portal graph retains the actual opening dimensions.
    if (cutaway) { g.visible = false; g.userData.cutaway = true; }
    box([width - .1, .035, .3], [0, -.27, 0], brass, g, .006);
    return g;
  }
  function portal(id, from, to, center, axis) {
    const d = axis === 'x' ? [.6, 0, 0] : [0, 0, .6];
    portals.push({ id, from, to, center, width: 2.6, height: 2.9,
      start: center.map((v, i) => v - d[i]), end: center.map((v, i) => v + d[i]) });
  }
  const corridor = group('night-corridor', layout.corridor.position);
  box([46, .18, 3], [0, -.4, 0], floor, corridor, .015, 'corridor-floor');
  for (let x = -22.8; x < 23; x += .38) box([.35, .025, 3], [x, -.295, 0], Math.round(x * 10) % 3 ? floor : floorAlt, corridor);
  for (const z of [-1.36, 1.36]) box([46, .015, .035], [0, -.274, z], brass, corridor);
  // Roof and camera-facing walls are intentionally cut away. Thin joists give
  // the architecture scale while keeping the room contents visible.
  for (let x = -20; x <= 22; x += 6) {
    box([.08, .12, 3], [x, 3.35, 0], walnut, corridor);
    cylinder(.16, .055, [x, 3.22, 0], warm, corridor, 20);
  }
  for (const [index, spec] of layout.zones.entries()) {
    const g = group(`zone-${spec.id}`, spec.pos), [w, d] = spec.size;
    const shell = material(spec.tone, .9, 0, 'paint');
    const dado = material('#364b43', .73, .05, 'paint');
    const rear = group(`rear-facade-${spec.id}`, [0, 0, 0], g); rearFacades[spec.id] = rear;
    box([w, .16, d], [0, -.39, 0], floor, g, .015, `${spec.id}-floor`);
    for (let x = -w / 2 + .2, i = 0; x < w / 2; x += .4, i++) {
      box([.385, .025, d - .03], [x, -.297, 0], i % 4 ? floor : floorAlt, g);
      for (const z of [-2.6, .35, 3]) box([.025, .002, .025], [x + .11, -.282, z], steel, g);
    }
    const backDoor = ['archive', 'analysis'].includes(spec.id);
    const backPieces = backDoor ? [[-(w + 2.6) / 4, (w - 2.6) / 2], [(w + 2.6) / 4, (w - 2.6) / 2]] : [[0, w]];
    for (const [x, width] of backPieces) {
      solid(`${spec.id}-rear-wall-${x}`, [width, 3.9, .18], [x, 1.6, -d / 2], shell, rear);
      box([width, 1.28, .055], [x, .35, -d / 2 + .12], dado, rear);
      box([width, .07, .075], [x, 1, -d / 2 + .15], walnut, rear);
      box([width, .11, .095], [x, -.19, -d / 2 + .16], walnut, rear);
    }
    // Low sectional side walls retain a solid lower wall on either side of a
    // 2.6m doorway. The open upper section is the inspection cutaway.
    for (const side of [-1, 1]) {
      const half = (d - 2.6) / 2;
      for (const z of [-(2.6 + half) / 2, (2.6 + half) / 2]) {
        solid(`${spec.id}-side-${side}-${z}`, [.15, 1.35, half], [side * w / 2, .365, z], dado, g);
        box([.2, .075, half], [side * w / 2, 1.065, z], walnut, g);
      }
      for (const z of [-d / 2 + .1, d / 2 - .1]) box([.17, 3.85, .17], [side * w / 2, 1.6, z], walnut, g);
    }
    box([w, .15, .23], [0, 3.48, -d / 2 + .03], walnut, rear);
    for (let x = -w / 2 + .65; x < w / 2; x += 1.4) {
      if (backDoor && Math.abs(x) < 1.4) continue;
      box([.045, 2.28, .03], [x, 2.16, -d / 2 + .11], trim, rear);
    }
    const doorway = frame(`doorway-${spec.id}`, [0, 0, d / 2], g, 2.6, false, true);
    // Small door plaques sit off centre so the principal sightline stays clear.
    text(spec.title, 1.25, .19, [-w / 2 + 1, 2.85, d / 2 + .15], g, { background: '#263e38', color: '#dfc69c' });
    const anchor = group(`anchor-${spec.id}`, [0, 1.2, 0], g);
    anchors[spec.id] = anchor;
    zones.push({ ...spec, index, name: spec.id, label: spec.title, position: spec.pos.slice(), size: spec.size.slice(), group: g, anchor, doorway });
    const fixture = group(`fixture-${spec.id}`, [-1.9, 3.1, -.9], g);
    cylinder(.012, .43, [0, .23, 0], brass, fixture, 12);
    const shade = craft.mesh(new THREE.ConeGeometry(.38, .2, 32, 1, true), trim, [0, 0, 0], fixture);
    shade.material.side = THREE.DoubleSide;
    cylinder(.22, .025, [0, -.105, 0], warm, fixture, 24);
    practicals.push(group(`light-${spec.id}`, [0, -.16, 0], fixture));
    // Back windows have their own reveal, sill and mullions. Archive/analysis
    // reserve the centre for the rear connecting doors.
    const wx = backDoor ? -w / 2 + 1.65 : w / 2 - 1.7;
    const window = group(`room-window-${spec.id}`, [wx, 2.2, -d / 2 + .13], rear);
    box([2.25, 2.05, .13], [0, 0, 0], walnut, window, .018);
    box([2.06, 1.87, .025], [0, 0, .08], glass, window);
    for (const x of [-1.06, 0, 1.06]) box([.065, 1.99, .08], [x, 0, .13], wood, window);
    for (const y of [-.97, 0, .97]) box([2.2, .06, .08], [0, y, .13], wood, window);
    box([2.4, .09, .4], [0, -1.07, .16], wood, window, .01);
    // Curtain rail and folded blackout cloth on the outer edge.
    box([2.55, .055, .07], [0, 1.15, .2], steel, window);
    for (let i = 0; i < 4; i++) box([.105, 2.05, .13], [-1.22 + i * .07, -.03, .23], trim, window, .018);
  }
  for (const { id, from, to, center, axis } of layout.connections) {
    // Boundary frames belong to the architecture root so no double wall fills
    // their opening, even when both adjacent room groups are visible.
    if (from !== 'corridor') boundaryFrames[id] = frame(id, [center[0], 0, center[2]], root, 2.6, axis === 'x');
    portal(id, from, to, center, axis);
  }
  zones.forEach(zone => Object.defineProperty(zones, zone.id in zones ? `${zone.id}Zone` : zone.id, { value: zone }));
  return { zones, anchors, portals, architectureWalls, practicals, layout,
    setCutaway(id) {
      for (const [key, facade] of Object.entries(rearFacades)) facade.visible = !((id === 'map' && key === 'analysis') || (id === 'handoff' && key === 'archive'));
      for (const [key, boundary] of Object.entries(boundaryFrames)) boundary.visible = !((id === 'map' && key === 'door-analysis-map') || (id === 'handoff' && key === 'door-archive-handoff'));
    },
  };
}
