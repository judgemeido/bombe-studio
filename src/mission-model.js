import * as THREE from 'three';

/** Original, procedural teaching models. Units are approximate metres. */
export function createMissionModel({ labelTexture } = {}) {
  const root = new THREE.Group();
  const material = (color, roughness = .65, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const wood = material('#664432'), edge = material('#352b25'), black = material('#172327', .43, .35);
  const brass = material('#c6a36a', .32, .68), ivory = material('#e6d9b7'), green = material('#37584e', .38, .3);
  const blue = material('#263e49'), wall = material('#1b2c34'), wire = material('#bf7c4d', .5, .3);
  function mesh(geometry, mat, pos, parent = root, name) {
    const m = new THREE.Mesh(geometry, mat); m.position.set(...pos); m.castShadow = true; m.receiveShadow = true;
    if (name) m.name = name; parent.add(m); return m;
  }
  const box = (size, pos, mat, parent = root, name) => mesh(new THREE.BoxGeometry(...size), mat, pos, parent, name);
  const cylinder = (r, h, pos, mat, parent = root, segments = 24) => mesh(new THREE.CylinderGeometry(r, r, h, segments), mat, pos, parent);
  function text(content, width, height, pos, parent = root, { flat = false, color = '#20333b', background = '#e6d9b7' } = {}) {
    const map = labelTexture?.(content, color, background);
    const m = mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: map || null, color: map ? '#ffffff' : background, roughness: .85 }), pos, parent);
    if (flat) m.rotation.x = -Math.PI / 2;
    return m;
  }
  function cable(points, radius, mat, parent = root) {
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 24, radius, 8, false), mat, [0, 0, 0], parent);
  }
  box([8.4, .2, 6.5], [0, -.38, -.35], edge);
  for (let n = -4; n < 4; n++) box([.012, .005, 6.4], [n + .3, -.275, -.35], wood);
  box([8.4, 4.8, .16], [0, 2, -3], wall);
  for (let n = -4; n <= 4; n += .5) box([.025, 4.5, .05], [n, 2, -2.89], blue);
  const windowGroup = new THREE.Group(); windowGroup.name = 'window'; root.add(windowGroup);
  const glass = new THREE.MeshBasicMaterial({ color: '#b3c7c7' });
  box([2.7, 2.7, .1], [-1.2, 2.5, -2.86], edge, windowGroup);
  box([2.5, 2.5, .05], [-1.2, 2.5, -2.79], glass, windowGroup);
  for (const x of [-2.45, -1.2, .05]) box([.08, 2.6, .1], [x, 2.5, -2.7], wood, windowGroup);
  for (const y of [1.25, 2.5, 3.75]) box([2.6, .08, .1], [-1.2, y, -2.7], wood, windowGroup);
  // Quiet silhouettes beyond the window, not a photographic historical claim.
  for (let n = 0; n < 6; n++) {
    box([.035, 1.4 + (n % 3) * .3, .02], [-2.3 + n * .42, 1.8, -2.73], blue, windowGroup);
    const twig = box([.026, .65, .02], [-2.25 + n * .42, 2, -2.72], blue, windowGroup); twig.rotation.z = -.5;
  }
  box([5.8, .16, 3.2], [0, .82, .1], wood, root, 'desk');
  box([5.85, .035, 3.25], [0, .9, .1], edge);
  for (const x of [-2.6, 2.6]) for (const z of [-1.15, 1.4]) box([.13, 1.2, .13], [x, .2, z], wood);
  // Desk grain and writing pad.
  for (let i = 0; i < 9; i++) box([5.65, .002, .008], [0, .921, -1.25 + i * .34], edge);
  box([2.5, .018, 2.18], [-.15, .932, .05], green);
  const enigma = new THREE.Group(); enigma.name = 'enigma'; enigma.position.set(-.2, 1.03, .28); root.add(enigma);
  box([2.1, .24, 1.85], [0, 0, 0], edge, enigma);
  box([1.93, .13, 1.69], [0, .16, 0], black, enigma);
  const lid = box([2.1, 1.05, .09], [0, .62, -.92], wood, enigma); lid.rotation.x = -.18;
  text('ENIGMA  ·  I  II  III', 1.3, .16, [0, .8, -.78], enigma);
  text('RING  A A A', .7, .1, [0, .57, -.73], enigma);
  const rotors = [];
  for (let i = 0; i < 3; i++) {
    const rotor = new THREE.Group(); rotor.position.set(-.54 + i * .54, .45, -.46); enigma.add(rotor); rotors.push(rotor);
    const core = cylinder(.275, .19, [0, 0, 0], ivory, rotor, 32); core.rotation.z = Math.PI / 2;
    for (const x of [-.108, .108]) {
      const ring = cylinder(.29, .028, [x, 0, 0], brass, rotor, 32); ring.rotation.z = Math.PI / 2;
    }
    for (let n = 0; n < 26; n++) {
      const a = n / 26 * Math.PI * 2;
      const tick = box([.2, .013, .025], [0, Math.cos(a) * .278, Math.sin(a) * .278], black, rotor); tick.rotation.x = a;
    }
    text(['I', 'II', 'III'][i], .19, .09, [-.54 + i * .54, .265, -.08], enigma, { flat: true });
  }
  const rows = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'];
  const letters = rows.join('');
  const keys = [], lamps = [];
  for (let i = 0; i < letters.length; i++) {
    const row = i < 9 ? 0 : i < 17 ? 1 : 2;
    const col = i - [0, 9, 17][row], x = (col - (rows[row].length - 1) / 2) * .207;
    const z = .3 + row * .225;
    const key = cylinder(.075, .065, [x, .283, z], brass, enigma, 16); keys.push(key);
    const cap = text(letters[i], .113, .113, [x, .321, z], enigma, { flat: true, color: '#e9e2cb', background: '#15212a' }); cap.userData.letter = letters[i];
    const lampMat = new THREE.MeshStandardMaterial({ color: '#cdc09c', emissive: '#edc477', emissiveIntensity: .02, roughness: .4 });
    const lamp = cylinder(.043, .014, [x, .247, -.04 + row * .09], lampMat, enigma, 12); lamp.userData.letter = letters[i]; lamps.push(lamp);
  }
  const plugs = new THREE.Group(); plugs.position.set(0, -.04, .949); enigma.add(plugs);
  for (let i = 0; i < 10; i++) {
    const plug = cylinder(.028, .03, [-.81 + i * .18, 0, 0], brass, plugs, 12); plug.rotation.x = Math.PI / 2;
  }
  const plugCable = cable([[-.81, -.01, .01], [-.78, -.22, .15], [-.25, -.2, .15], [-.27, -.01, .01]], .025, wire, plugs);
  plugCable.visible = false;
  // Radio receiver with grille, tuning window and an operable needle.
  const radio = new THREE.Group(); radio.name = 'radio'; radio.position.set(-2.05, 1.4, -.6); radio.rotation.y = .12; root.add(radio);
  box([1.2, .9, .65], [0, 0, 0], edge, radio);
  box([1.05, .75, .035], [0, 0, .35], green, radio);
  for (let i = 0; i < 10; i++) box([.39, .026, .04], [-.25, -.29 + i * .064, .38], black, radio);
  text('A   B   C', .45, .17, [.24, .18, .39], radio);
  const needle = box([.015, .18, .02], [.07, .18, .415], wire, radio);
  for (const x of [.11, .38]) { const knob = cylinder(.09, .07, [x, -.19, .41], brass, radio); knob.rotation.x = Math.PI / 2; }
  cable([[0, .42, 0], [.1, 1.08, 0], [.13, 1.2, 0]], .012, brass, radio);
  // A compact 27-drum teaching representation, distinct from the full exhibit.
  const bombe = new THREE.Group(); bombe.name = 'bombe'; bombe.position.set(2.05, 1.94, -1.12); bombe.rotation.y = -.12; root.add(bombe);
  box([1.38, 2.15, .52], [0, 0, 0], green, bombe);
  box([1.21, 1.9, .035], [0, .02, .29], black, bombe);
  const drums = [], drumMats = ['#ab6455', '#d4b379', '#6a8f87'].map(c => material(c, .5, .3));
  for (let row = 0; row < 9; row++) for (let col = 0; col < 3; col++) {
    const drum = new THREE.Group(); drum.position.set((col - 1) * .36, .79 - row * .197, .33); bombe.add(drum); drums.push(drum);
    const face = cylinder(.078, .095, [0, 0, 0], drumMats[Math.floor(row / 3)], drum, 20); face.rotation.x = Math.PI / 2;
    const cap = cylinder(.032, .11, [0, 0, .01], brass, drum, 16); cap.rotation.x = Math.PI / 2;
    box([.013, .04, .01], [0, .05, .056], ivory, drum);
  }
  text('BOMBE', .75, .13, [0, 1.0, .29], bombe);
  text('SEARCH  /  CHECK', .79, .09, [0, -.96, .29], bombe);
  for (const x of [-.5, .5]) box([.12, .18, .4], [x, -1.13, 0], black, bombe);
  // Banker lamp with warm physical light added by the scene owner.
  cylinder(.23, .045, [1.25, .97, .7], brass);
  cylinder(.035, .89, [1.25, 1.43, .7], brass);
  const shade = mesh(new THREE.SphereGeometry(.34, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), green, [1.25, 1.9, .7]); shade.scale.z = .65;
  const glow = new THREE.MeshBasicMaterial({ color: '#ffe0a1', side: THREE.DoubleSide });
  const bulb = mesh(new THREE.CircleGeometry(.28, 24), glow, [1.25, 1.895, .7]); bulb.rotation.x = Math.PI / 2; bulb.scale.y = .65;
  // Papers, pencil and an archive folder remain real geometry.
  const paper = text('WETTER\nB · D · ?\n06 : 00', .78, .95, [1.97, .945, .7], root, { flat: true }); paper.rotation.z = -.1;
  const pencil = cylinder(.013, .71, [2.48, .965, .6], wire); pencil.rotation.z = Math.PI / 2; pencil.rotation.y = -.9;
  text('BLETCHLEY PARK\n1941', 1.35, .6, [1.65, 3.45, -2.88]);
  let disposed = false;
  return {
    root, rotors, drums,
    update(s, time, { reduced = false, searchProgress = null, positions = s.positions, inputLetter = null, outputLetter = null } = {}) {
      const searching = searchProgress !== null;
      for (let i = 0; i < 3; i++) {
        const target = -(positions[i] || 0) * Math.PI * 2 / 26;
        rotors[i].rotation.x = reduced ? target : THREE.MathUtils.lerp(rotors[i].rotation.x, target, .16);
      }
      needle.position.x = .07 + (s.channel ?? 0) * .16;
      plugCable.visible = s.stage > 2 || s.pair !== null;
      plugCable.material = s.pair === 'A' || s.stage > 2 ? wire : black;
      drums.forEach((drum, i) => { if (searching && !reduced) drum.rotation.z = -time * (2 + i % 3 * 2); });
      lamps.forEach(lamp => { lamp.material.emissiveIntensity = lamp.userData.letter === outputLetter ? 2.2 : .02; });
      keys.forEach((key, i) => { key.position.y = .283 - (letters[i] === inputLetter ? .025 : 0); });
    },
    dispose() {
      if (disposed) return; disposed = true;
      const geometries = new Set(), materials = new Set(), textures = new Set();
      root.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
      // A temporarily unused wire material still belongs to this model.
      [wood, edge, black, brass, ivory, green, blue, wall, wire].forEach(m => materials.add(m));
      materials.forEach(m => { if (m.map) textures.add(m.map); m.dispose(); });
      textures.forEach(t => t.dispose()); geometries.forEach(g => g.dispose()); root.clear();
    },
  };
}
