import * as THREE from 'three';
import { createMissionCraft } from './mission-craft.js';

/** Original teaching reconstruction. Exposed mechanisms are intentional cutaways. */
export function createMissionModel({ labelTexture } = {}) {
  const root = new THREE.Group();
  const craft = createMissionCraft(labelTexture);
  const { material, box, cylinder, ring, cable, text, screw, mesh } = craft;
  const wood = material('#65402c', .51, 0, 'wood'), walnut = material('#35271d', .6, 0, 'wood');
  const dark = material('#111b1c', .47, .3, 'paint'), steel = material('#8c9691', .32, .78);
  const brass = material('#ac8650', .37, .76), ivory = material('#e3d7af', .59), green = material('#3b5145', .48, .35, 'paint');
  const wall = material('#21333a', .88, 0, 'paint'), rubber = material('#1b2020', .92), copper = material('#98714c', .52, .55);
  const paperMat = material('#cfc4a1', .96), leather = material('#273e36', .93, 0, 'paint');
  function group(name, pos, parent = root) { const g = new THREE.Group(); g.name = name; g.position.set(...pos); parent.add(g); return g; }
  function frontCylinder(r, depth, pos, mat, parent, segments = 32) { const c = cylinder(r, depth, pos, mat, parent, segments); c.rotation.x = Math.PI / 2; return c; }

  const room = group('room', [0, 0, 0]);
  for (let i = 0; i < 17; i++) box([.49, .11, 6.2], [-4 + i * .5, -.32, -.25], i % 3 ? walnut : wood, room, .01);
  box([8.4, 4.75, .15], [0, 2, -3], wall, room);
  for (let x = -4; x <= 4; x += .42) box([.015, 4.6, .025], [x, 2, -2.91], dark, room);
  for (const y of [-.12, 4.12]) box([8.4, .16, .1], [0, y, -2.85], walnut, room, .012);
  const windowGroup = group('window', [-1.45, 2.5, -2.82]);
  box([2.8, 2.85, .16], [0, 0, 0], walnut, windowGroup, .035);
  const glass = material('#7896a0', .33, .18); glass.emissive.set('#647f8c'); glass.emissiveIntensity = .38;
  box([2.57, 2.6, .035], [0, 0, .1], glass, windowGroup);
  for (const x of [-1.32, 0, 1.32]) box([.065, 2.69, .19], [x, 0, .18], wood, windowGroup, .006);
  for (const y of [-1.33, 0, 1.33]) box([2.71, .065, .19], [0, y, .18], wood, windowGroup, .006);
  box([2.95, .1, .37], [0, -1.39, .15], wood, windowGroup, .015);
  box([.12, .04, .055], [.12, .03, .3], brass, windowGroup, .009);
  for (let n = 0; n < 5; n++) {
    const tree = group('', [-1.15 + n * .47, -.66, .127], windowGroup);
    box([.018, 1.1 + n % 2 * .25, .012], [0, 0, 0], wall, tree);
    for (const sign of [-1, 1]) { const b = box([.013, .45, .012], [sign * .1, .12, 0], wall, tree); b.rotation.z = sign * -.47; }
  }

  const desk = group('desk', [0, .85, .08]);
  box([5.8, .15, 3.2], [0, 0, 0], wood, desk, .04);
  box([5.86, .065, 3.24], [0, .07, 0], walnut, desk, .022);
  for (const x of [-2.57, 2.57]) for (const z of [-1.25, 1.25]) {
    box([.15, 1.12, .15], [x, -.58, z], walnut, desk, .018);
    box([.17, .12, .17], [x, -.13, z], wood, desk, .018);
  }
  for (const z of [-1.32, 1.32]) box([5.25, .25, .085], [0, -.2, z], wood, desk, .01);
  box([2.6, .019, 2.45], [-.2, .117, .08], leather, desk, .025);
  for (const x of [-.92, .92]) { box([1.64, .17, .055], [x, -.2, 1.376], walnut, desk, .01); box([.3, .032, .065], [x, -.2, 1.42], brass, desk, .014); }

  const enigma = group('enigma', [-.2, 1.08, .2]);
  box([2.24, .22, 2.08], [0, -.015, 0], walnut, enigma, .04);
  for (const x of [-1.075, 1.075]) box([.095, .26, 2.05], [x, .1, 0], wood, enigma, .018);
  box([2.02, .12, 1.91], [0, .18, 0], dark, enigma, .045);
  box([1.98, .09, .53], [0, .28, -.59], dark, enigma, .025);
  const lid = group('enigma-lid', [0, .18, -1.02], enigma);
  box([2.23, 1.98, .085], [0, .99, 0], wood, lid, .035);
  box([1.98, 1.68, .02], [0, 1, .049], walnut, lid, .025);
  text('ENIGMA', .84, .15, [0, 1.59, .064], lid, { background: '#35271d' });
  text('TASTENDRUCK  →  STROMLAUF\nWALZEN  I · II · III\nRINGSTELLUNG  A · A · A', 1.47, .58, [0, 1.01, .067], lid, { background: '#c8bb92', color: '#353c32' });
  for (const x of [-.76, .76]) {
    const hinge = cylinder(.032, .22, [x, .18, -1.025], brass, enigma, 20); hinge.rotation.z = Math.PI / 2;
    box([.18, .2, .019], [x, .14, .059], brass, lid, .007); screw(x, .16, .074, steel, dark, lid);
    box([.17, .13, .045], [x, -.012, 1.055], brass, enigma, .012);
    box([.1, .07, .028], [x, .023, 1.09], steel, enigma, .005);
  }
  for (const x of [-1.135, 1.135]) { const h = ring(.15, .022, [x, .03, -.02], rubber, enigma); h.rotation.y = Math.PI / 2; h.scale.y = .5; }
  const rotors = [];
  const axle = cylinder(.025, 1.76, [0, .49, -.62], steel, enigma); axle.rotation.z = Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const x = -.54 + i * .54;
    const rotor = group(`rotor-${i}`, [x, .49, -.62], enigma); rotors.push(rotor);
    const core = cylinder(.225, .29, [0, 0, 0], rubber, rotor, 52); core.rotation.z = Math.PI / 2;
    for (const dx of [-.158, .158]) {
      const plate = cylinder(.235, .024, [dx, 0, 0], brass, rotor, 52); plate.rotation.z = Math.PI / 2;
      const rim = ring(.23, .012, [dx, 0, 0], steel, rotor); rim.rotation.y = Math.PI / 2;
      for (let n = 0; n < 26; n++) {
        const a = n / 26 * Math.PI * 2;
        const pin = cylinder(.008, .016, [dx * 1.13, Math.cos(a) * .18, Math.sin(a) * .18], copper, rotor, 8); pin.rotation.z = Math.PI / 2;
      }
    }
    const band = cylinder(.237, .105, [.046, 0, 0], ivory, rotor, 52); band.rotation.z = Math.PI / 2;
    for (let n = 0; n < 26; n++) {
      const a = n / 26 * Math.PI * 2;
      const tooth = box([.037, .024, .036], [-.18, Math.cos(a) * .24, Math.sin(a) * .24], steel, rotor, .003); tooth.rotation.x = a;
      const mark = text(String(n + 1).padStart(2, '0'), .074, .047, [.046, Math.cos(a) * .24, Math.sin(a) * .24], rotor, { flat: true, color: '#202d2e', background: '#dfd3ac' }); mark.rotation.x += a;
    }
    box([.033, .16, .07], [x, .295, -.88], steel, enigma, .009);
    text(['I', 'II', 'III'][i], .17, .07, [x, .333, -.22], enigma, { flat: true });
  }
  for (const x of [-.98, .98]) for (const z of [-.87, .13, .89]) screw(x, .252, z, steel, rubber, enigma, true);
  const rows = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'], keys = [], lamps = [], sockets = new Map();
  box([1.94, .016, .43], [0, .253, -.012], dark, enigma, .022);
  const plugboard = group('plugboard', [0, -.025, 1.062], enigma);
  box([1.94, .23, .025], [0, 0, 0], dark, plugboard, .018);
  rows.forEach((row, ri) => [...row].forEach((letter, col) => {
    const x = (col - (row.length - 1) / 2) * .211, z = .39 + ri * .235;
    cylinder(.032, .08, [x, .284, z], steel, enigma, 16);
    const key = group(`key-${letter}`, [x, .328, z], enigma); key.userData.letter = letter; keys.push(key);
    cylinder(.086, .04, [0, 0, 0], steel, key); cylinder(.076, .013, [0, .025, 0], rubber, key);
    text(letter, .132, .132, [0, .033, 0], key, { circle: true, flat: true, name: 'key-letter', color: '#ebe3c9' });
    ring(.077, .006, [0, .034, 0], brass, key).rotation.x = Math.PI / 2;
    const lz = -.13 + ri * .14;
    ring(.055, .008, [x, .271, lz], steel, enigma).rotation.x = Math.PI / 2;
    const lamp = text(letter, .092, .092, [x, .279, lz], enigma, { circle: true, flat: true, color: '#423c2d', background: '#c6ba95', name: `lamp-${letter}` });
    lamp.material = lamp.material.clone(); lamp.material.emissive.set('#eab95d'); lamp.material.emissiveMap = lamp.material.map; lamp.material.emissiveIntensity = .025;
    lamp.userData.dynamic = true; lamps.push(lamp); lamp.userData.letter = letter;
    const sy = .065 - ri * .073; sockets.set(letter, [x, sy, .035]);
    for (const dx of [-.023, .023]) { frontCylinder(.017, .015, [x + dx, sy, .022], brass, plugboard, 12); frontCylinder(.01, .017, [x + dx, sy, .028], rubber, plugboard, 12); }
    text(letter, .045, .037, [x, sy + .029, .031], plugboard);
  }));
  const plugs = group('active-plug-pair', [0, 0, 0], plugboard);
  const a = sockets.get('A'), g = sockets.get('G');
  for (const p of [a, g]) {
    box([.069, .04, .061], [p[0], p[1], .068], rubber, plugs, .012);
    for (let n = 0; n < 4; n++) frontCylinder(.019 - n * .001, .009, [p[0], p[1], .1 + n * .01], rubber, plugs, 16);
  }
  // Lead over the desk edge before hanging down, so the wire never passes through the timber.
  cable([[a[0], a[1], .14], [a[0] - .03, .02, .34], [a[0] + .03, -.1, .59], [g[0] - .05, -.18, .64], [g[0] + .09, .01, .35], [g[0], g[1], .14]], .018, rubber, plugs);
  plugs.visible = false;

  const radio = group('radio', [-2.05, 1.43, -.68]); radio.rotation.y = .12;
  box([1.22, .93, .73], [0, 0, 0], walnut, radio, .07); box([1.1, .79, .045], [0, 0, .37], green, radio, .022);
  box([.46, .6, .025], [-.265, -.015, .4], rubber, radio, .04);
  for (let i = 0; i < 14; i++) box([.41, .012, .026], [-.265, -.275 + i * .04, .418], steel, radio, .003);
  box([.45, .25, .028], [.25, .16, .412], brass, radio, .016);
  text('A     B     C\n550 · 700 · 900', .4, .2, [.25, .16, .433], radio, { background: '#c6b784', color: '#272c24' });
  const needle = box([.008, .15, .008], [.09, .16, .443], copper, radio, 0, 'radio-needle');
  for (const x of [.11, .4]) {
    frontCylinder(.106, .04, [x, -.18, .428], steel, radio); frontCylinder(.081, .075, [x, -.18, .48], rubber, radio);
    for (let i = 0; i < 20; i++) { const t = i / 20 * Math.PI * 2; frontCylinder(.006, .05, [x + Math.cos(t) * .081, -.18 + Math.sin(t) * .081, .49], dark, radio, 8); }
    box([.007, .039, .008], [x, -.132, .524], ivory, radio);
  }
  for (const x of [-.49, .49]) for (const y of [-.33, .33]) screw(x, y, .405, brass, rubber, radio);
  text('WIRELESS RECEIVER', .49, .055, [.17, -.34, .402], radio);
  const phones = group('headphones', [-1.9, 1.02, .59]); phones.rotation.x = -.3;
  const band = ring(.29, .024, [0, .06, 0], rubber, phones); band.scale.y = .84; band.rotation.x = Math.PI / 2;
  for (const x of [-.29, .29]) { cylinder(.107, .065, [x, .045, 0], rubber, phones); ring(.087, .011, [x, .08, 0], steel, phones).rotation.x = Math.PI / 2; }
  cable([[-.48, -.22, .44], [-.75, -.45, .8], [-.58, -.43, 1.03], [-.12, -.42, 1.0]], .012, rubber, radio);

  // 27-drum teaching rack; the full 108-drum exhibit remains in chapter 01.
  const bombe = group('bombe', [2.06, 1.99, -1.2]); bombe.rotation.y = -.12;
  box([1.48, 2.18, .54], [0, 0, 0], green, bombe, .04); box([1.34, 1.91, .028], [0, .03, .285], dark, bombe, .013);
  for (const x of [-.7, .7]) { box([.08, 2.17, .09], [x, 0, .31], steel, bombe, .007); box([.15, .14, .68], [x, -1.1, 0], dark, bombe, .02); }
  const drums = [], colors = ['#9e5949', '#c3a273', '#577e74'].map(c => material(c, .4, .45, 'paint'));
  for (let block = 0; block < 3; block++) {
    const cy = .65 - block * .61;
    box([1.24, .59, .042], [0, cy, .32], green, bombe, .008);
    for (const x of [-.586, .586]) for (const y of [-.265, .265]) screw(x, cy + y, .35, steel, rubber, bombe, false, .013);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
      const x = (col - 1) * .37, y = cy + .18 - row * .18;
      frontCylinder(.088, .03, [x, y, .353], steel, bombe);
      const drum = group(`drum-${drums.length}`, [x, y, .385], bombe); drums.push(drum);
      frontCylinder(.078, .105, [0, 0, 0], colors[block], drum, 32); ring(.072, .006, [0, 0, .055], brass, drum);
      frontCylinder(.039, .012, [0, 0, .063], dark, drum); frontCylinder(.016, .027, [0, 0, .076], steel, drum, 16);
      for (let n = 0; n < 12; n++) { const t = n * Math.PI / 6; const tick = box([.003, .011, .005], [Math.sin(t) * .059, Math.cos(t) * .059, .06], ivory, drum); tick.rotation.z = -t; }
      box([.014, .027, .005], [0, .028, .075], ivory, drum);
    }
  }
  text('BOMBE  /  CHECKING', 1.08, .095, [0, 1.015, .29], bombe, { background: '#334536' });
  for (let i = 0; i < 12; i++) box([.012, 1.55, .008], [.752, -.03, -.15 + i * .029], dark, bombe);
  text('LOGIC  ·  SEARCH  ·  VERIFY', .94, .067, [0, -.985, .294], bombe);
  for (const x of [-.35, 0, .35]) frontCylinder(.022, .014, [x, -.87, .348], x ? brass : ivory, bombe, 16);
  for (let i = 0; i < 6; i++) cable([[.7, .75 - i * .19, -.27], [.85 + i * .014, .5 - i * .19, -.37], [.83, -.75, -.32]], .009, i % 2 ? copper : rubber, bombe);

  // The open shade owns its light anchor; no opaque disk blocks the bulb.
  const lamp = group('desk-lamp', [1.18, .98, .74]);
  cylinder(.24, .045, [0, 0, 0], dark, lamp); cylinder(.205, .031, [0, .034, 0], brass, lamp);
  cylinder(.027, .87, [0, .47, 0], brass, lamp);
  const arm = cylinder(.02, .38, [0, .88, -.17], brass, lamp); arm.rotation.x = Math.PI / 2;
  const shade = mesh(new THREE.SphereGeometry(.33, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), green, [0, .98, -.21], lamp); shade.scale.set(1.32, .65, .68);
  const rim = ring(.33, .012, [0, .98, -.21], brass, lamp); rim.rotation.x = Math.PI / 2; rim.scale.set(1.32, .68, 1);
  const bulbMat = material('#fff1c5', .25); bulbMat.emissive.set('#ffc77c'); bulbMat.emissiveIntensity = 2;
  const bulb = mesh(new THREE.SphereGeometry(.055, 16, 12), bulbMat, [0, .962, -.21], lamp); bulb.scale.x = 2.1;
  const lampAnchor = group('lamp-light', [0, .91, -.21], lamp);
  cable([[0, .015, .13], [.23, -.02, .29], [.63, -.02, .15], [.76, -.3, -.15]], .011, rubber, lamp);
  const papers = group('intercept-papers', [2.02, .987, .73]); papers.rotation.y = -.13;
  for (let n = 0; n < 4; n++) { const p = box([.8, .003, .97], [n * .009, n * .004, n * .008], paperMat, papers); p.rotation.y = n * .014; }
  text('INTERCEPT  /  06:00\nWW · ... · WETTER ?\nB · D · ?\nCHECK BEFORE REPORTING', .74, .9, [0, .02, 0], papers, { flat: true, background: '#d7c9a5', color: '#34453c' });
  const pencil = cylinder(.014, .64, [2.52, 1.015, .68], copper, root, 6); pencil.rotation.z = Math.PI / 2; pencil.rotation.y = -.95;
  const cup = group('enamel-mug', [-1.4, 1.07, -.94]); cylinder(.1, .19, [0, 0, 0], ivory, cup);
  cylinder(.084, .005, [0, .096, 0], walnut, cup); ring(.092, .009, [0, .102, 0], dark, cup).rotation.x = Math.PI / 2;
  const handle = ring(.072, .013, [.13, .01, 0], ivory, cup); handle.scale.x = .7;
  text('BLETCHLEY PARK\nHUT 8 · 1941', 1.29, .45, [1.61, 3.5, -2.89], root, { background: '#bbae8b', color: '#293c3b' });
  craft.batch(root);
  let disposed = false;
  return {
    root, rotors, drums, keys, lamps, lid, lampAnchor,
    update(s, time, { reduced = false, searchProgress = null, positions = s.positions, inputLetter = null, outputLetter = null, lidOpen = 1 } = {}) {
      // The teaching cutaway exposes raised rotors, so begin with the lid already ajar.
      lid.rotation.x = THREE.MathUtils.lerp(.45, -.2, lidOpen);
      for (let i = 0; i < 3; i++) {
        const target = -(positions[i] || 0) * Math.PI * 2 / 26;
        rotors[i].rotation.x = reduced ? target : THREE.MathUtils.lerp(rotors[i].rotation.x, target, .18);
      }
      needle.position.x = .09 + (s.channel ?? 0) * .16;
      plugs.visible = s.stage > 2 || s.pair === 'A';
      drums.forEach((drum, i) => { if (searchProgress !== null && !reduced) drum.rotation.z = -time * (2 + i % 3 * 2); });
      lamps.forEach(lamp => { lamp.material.emissiveIntensity = lamp.userData.letter === outputLetter ? 2.1 : .025; });
      keys.forEach(key => { key.position.y = .328 - (key.userData.letter === inputLetter ? .026 : 0); });
    },
    dispose() {
      if (disposed) return; disposed = true;
      lamps.forEach(lamp => lamp.material.dispose()); craft.dispose(); root.clear();
    },
  };
}
