import * as THREE from 'three';

/** Reusable joinery and apparatus; named assemblies survive craft batching. */
export function createMissionProps(craft, mats) {
  const { box, cylinder, ring, cable, mesh, text } = craft;
  const { wood, walnut, steel, brass, rubber, paperMat, leather, green, ivory, copper, dark } = mats;
  function group(name, pos, parent) { const g = new THREE.Group(); g.name = name; g.position.set(...pos); parent.add(g); return g; }
  function table(name, pos, parent, width = 3.8, depth = 1.8, top = 1.05) {
    const g = group(name, pos, parent);
    box([width, .14, depth], [0, top - .07, 0], wood, g, .035, 'tabletop');
    box([width + .015, .035, depth + .015], [0, top + .006, 0], walnut, g, .014);
    for (const [i, x] of [-width / 2 + .2, width / 2 - .2].entries()) for (const [j, z] of [-depth / 2 + .18, depth / 2 - .18].entries()) {
      const leg = group(`table-leg-${i * 2 + j}`, [x, -.29, z], g);
      box([.13, top + .16, .13], [0, (top + .16) / 2, 0], walnut, leg, .013);
      box([.16, .1, .16], [0, .05, 0], dark, leg, .01);
    }
    for (const z of [-depth / 2 + .12, depth / 2 - .12]) box([width - .35, .22, .075], [0, top - .23, z], walnut, g, .008);
    const drawer = group('table-drawer', [0, top - .26, depth / 2 - .02], g);
    box([width * .38, .24, .08], [0, 0, 0], wood, drawer, .012);
    box([.38, .035, .05], [0, 0, .075], brass, drawer, .008);
    return g;
  }
  function chair(name, pos, parent, yaw = 0) {
    const g = group(name, pos, parent); g.rotation.y = yaw;
    box([.86, .12, .83], [0, .44, 0], walnut, g, .055, 'chair-seat');
    box([.7, .045, .65], [0, .515, .02], leather, g, .04);
    for (const x of [-.33, .33]) for (const z of [-.3, .3]) {
      const leg = box([.075, .76, .075], [x, .07, z], wood, g, .013); leg.rotation.z = x * -.07;
    }
    for (const x of [-.35, .35]) box([.09, 1.25, .085], [x, .89, -.34], walnut, g, .012);
    box([.77, .2, .075], [0, 1.45, -.34], wood, g, .02);
    for (const x of [-.18, 0, .18]) box([.055, .73, .055], [x, 1.02, -.34], wood, g, .009);
    box([.68, .055, .055], [0, -.01, -.28], walnut, g);
    return g;
  }
  function papers(name, pos, parent, content, width = 1.1, depth = .75) {
    const g = group(name, pos, parent);
    for (let i = 0; i < 5; i++) {
      const page = box([width, .006, depth], [i * .012, i * .009, i * -.01], paperMat, g, .004); page.rotation.y = i * .015;
    }
    text(content, width * .9, depth * .85, [0, .05, 0], g, { flat: true, background: '#cfc4a1', color: '#34473d' });
    return g;
  }
  function deskLamp(name, pos, parent, scale = 1) {
    const g = group(name, pos, parent); g.scale.setScalar(scale);
    cylinder(.19, .05, [0, 0, 0], dark, g);
    cylinder(.035, .66, [0, .35, 0], brass, g, 20);
    const arm = cylinder(.024, .38, [0, .68, -.16], brass, g, 20); arm.rotation.x = Math.PI / 2;
    mesh(new THREE.SphereGeometry(.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), green, [0, .75, -.23], g).scale.set(1.25, .63, .75);
    ring(.3, .012, [0, .75, -.23], brass, g).rotation.x = Math.PI / 2;
    const glow = craft.material('#ffe6b1', .4); glow.emissive.set('#ffd18b'); glow.emissiveIntensity = 1.2;
    mesh(new THREE.SphereGeometry(.045, 12, 8), glow, [0, .72, -.23], g);
    cable([[0, 0, .1], [.3, -.02, .23], [.57, -.05, .2], [.65, -.38, .15]], .012, rubber, g);
    return g;
  }
  function phone(name, pos, parent) {
    const g = group(name, pos, parent);
    box([1.02, .16, .78], [0, .08, 0], dark, g, .1);
    const dial = group('telephone-dial', [0, .18, .1], g); dial.rotation.x = .17;
    cylinder(.25, .035, [0, 0, 0], brass, dial, 40);
    cylinder(.175, .045, [0, .025, 0], rubber, dial, 40);
    cylinder(.1, .05, [0, .03, 0], ivory, dial, 32);
    for (let n = 0; n < 10; n++) {
      const a = n / 10 * Math.PI * 2;
      cylinder(.033, .045, [Math.sin(a) * .208, .025, Math.cos(a) * .208], rubber, dial, 12);
    }
    for (const x of [-.34, .34]) box([.07, .31, .075], [x, .29, -.22], brass, g, .012);
    const handset = group('telephone-handset', [0, .48, -.22], g);
    cable([[-.4, 0, 0], [-.2, .11, 0], [.2, .11, 0], [.4, 0, 0]], .065, rubber, handset);
    for (const x of [-.4, .4]) {
      cylinder(.14, .13, [x, 0, 0], dark, handset, 32);
      cylinder(.12, .016, [x, -.075, 0], rubber, handset, 24);
    }
    const cord = [];
    for (let n = 0; n <= 90; n++) { const t = n / 90; cord.push([-.43 + Math.sin(n * .8) * .028, .45 - t * .85, -.22 + Math.cos(n * .8) * .028 + t * .3]); }
    cable(cord, .009, rubber, g);
    return g;
  }
  function cabinet(name, pos, parent, width = 1.5, height = 2.7, depth = .65) {
    const g = group(name, pos, parent);
    box([width, height, depth], [0, height / 2 - .29, 0], walnut, g, .03);
    for (let i = 0; i < 5; i++) {
      const y = -.16 + (i + .5) * (height - .18) / 5;
      box([width - .1, (height - .3) / 5, .055], [0, y, depth / 2 + .01], wood, g, .015);
      box([.28, .06, .04], [0, y + .06, depth / 2 + .05], brass, g, .008);
      text(`FILE  ${String(i + 1).padStart(2, '0')}`, .3, .065, [0, y - .08, depth / 2 + .045], g, { background: '#d0bf95', color: '#364537' });
    }
    return g;
  }
  function magnifier(pos, parent) {
    const g = group('analysis-magnifier', pos, parent);
    cylinder(.18, .055, [0, 0, 0], dark, g);
    cable([[0, 0, 0], [0, .5, -.12], [.22, .72, -.15], [.5, .65, -.05]], .026, brass, g);
    const head = group('magnifier-head', [.55, .64, 0], g); head.rotation.x = -.5;
    ring(.27, .04, [0, 0, 0], green, head).rotation.x = Math.PI / 2;
    const lens = craft.material('#bfd6d4', .14, .1); lens.transparent = true; lens.opacity = .28;
    cylinder(.24, .018, [0, 0, 0], lens, head, 48);
    return g;
  }
  return { group, table, chair, papers, deskLamp, phone, cabinet, magnifier };
}
