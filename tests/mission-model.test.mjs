import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3, Raycaster } from 'three';
import { createMissionModel } from '../src/mission-model.js';
import { MISSION_VIEWS } from '../src/mission-transition.js';

test('room has inspectable machines and bounded geometry; state changes animate rotors', () => {
  const model = createMissionModel();
  for (const name of ['enigma', 'radio', 'bombe', 'desk', 'window']) assert.ok(model.root.getObjectByName(name), name);
  assert.equal(model.rotors.length, 3); assert.equal(model.drums.length, 27);
  const box = new Box3().setFromObject(model.root);
  assert.ok(box.max.x - box.min.x > 18); assert.ok(Number.isFinite(box.max.y));
  const before = model.rotors.map(r => r.rotation.x);
  model.update({ stage: 3, positions: [1, 3, 0], channel: 1, pair: 'A' }, 1, { reduced: true });
  assert.notDeepEqual(model.rotors.map(r => r.rotation.x), before);
  let released = 0; const geometry = model.rotors[0].children[0].geometry;
  geometry.addEventListener('dispose', () => released++);
  model.dispose(); model.dispose(); assert.equal(released, 1);
});

test('a pressed key carries its letter with it and releases as a single assembly', () => {
  const model = createMissionModel();
  try {
    const key = model.keys.find(k => k.userData.letter === 'W');
    const label = key.getObjectByName('key-letter');
    const state = { stage: 5, positions: [1, 3, 5], channel: 1, pair: 'A' };
    model.root.updateMatrixWorld(true);
    const before = label.getWorldPosition(new Vector3()).y;
    model.update(state, 1, { reduced: true, inputLetter: 'W', outputLetter: 'D' });
    model.root.updateMatrixWorld(true);
    assert.ok(label.getWorldPosition(new Vector3()).y < before - .015);
    assert.equal(model.lamps.filter(l => l.material.emissiveIntensity > 1).length, 1);
    model.update(state, 2, { reduced: true }); model.root.updateMatrixWorld(true);
    assert.equal(label.getWorldPosition(new Vector3()).y, before);
  } finally { model.dispose(); }
});

test('the arrival lid is articulated at its hinge and returns to the open inspection pose', () => {
  const model = createMissionModel();
  try {
    const state = { stage: 0, positions: [0, 0, 0], channel: null, pair: null };
    model.update(state, 0, { reduced: true, lidOpen: 0 });
    const closed = model.lid.rotation.x;
    model.update(state, 10, { reduced: true, lidOpen: 1 });
    assert.ok(Math.abs(closed - model.lid.rotation.x) > .5);
    // At the rear rotor centre, even the lowest animated lid edge clears the rotor top.
    const lidHeightAtRotor = .18 + .4 / Math.tan(closed);
    assert.ok(lidHeightAtRotor > .49 + .237);
  } finally { model.dispose(); }
});

test('the mission world exposes seven connected zones, anchors, interactives, and safe bounds', () => {
  const model = createMissionModel();
  try {
    assert.equal(model.zones.length, 7);
    assert.deepEqual(model.zones.map(zone => zone.id), ['entry', 'radio', 'archive', 'analysis', 'machine', 'map', 'handoff']);
    for (const id of model.zones.map(zone => zone.id)) {
      assert.ok(model.anchors[id], `anchor ${id}`);
      assert.ok(model.zones.find(zone => zone.id === id).group.isObject3D, `group ${id}`);
      const bounds = model.getBounds(id);
      assert.ok(bounds && !bounds.isEmpty(), `bounds ${id}`);
      assert.equal(model.setZone(id).id, id);
    }
    assert.equal(model.setZone('entrance').id, 'entry');
    assert.ok(model.interactives.length >= 10);
    const world = model.getBounds();
    assert.ok(world.max.x - world.min.x > 18, 'world should read as a larger multi-room space');
    assert.ok(world.max.z - world.min.z > 12, 'world depth should include connected rooms');
    assert.ok(model.bounds && !model.bounds.isEmpty());
  } finally { model.dispose(); }
});

test('each room places a recognizable apparatus inside its camera target', () => {
  const model = createMissionModel();
  try {
    const zone = id => model.zones.find(item => item.id === id).group;
    assert.equal(model.anchors.radioMachine.parent.uuid, zone('radio').uuid);
    assert.equal(model.anchors.desk.parent.uuid, zone('archive').uuid);
    assert.equal(model.anchors.bombe.parent.uuid, zone('machine').uuid);
    for (const [id, names] of Object.entries({
      entry: ['entry-register-book', 'entry-chair'],
      radio: ['radioMachine'],
      archive: ['desk', 'enigma'],
      analysis: ['analysis-file-stack', 'analysis-board'],
      machine: ['bombe', 'machine-console'],
      map: ['map-route', 'map-pin'],
      handoff: ['handoff-form', 'handoff-chair'],
    })) {
      assert.ok(names.some(name => zone(id).getObjectByName(name)), `${id} should contain a recognizable prop`);
    }
  } finally { model.dispose(); }
});

test('room camera rails keep the apparatus in front of the room furniture', () => {
  const model = createMissionModel();
  try {
    model.root.updateMatrixWorld(true);
    const bounds = name => new Box3().setFromObject(model.root.getObjectByName(name));
    const panel = bounds('machine-panel');
    const bombe = bounds('bombe');
    assert.ok(panel.max.z < bombe.min.z, 'machine panel must sit behind the Bombe');
    const mapTable = bounds('map-table');
    assert.ok(MISSION_VIEWS.map.camera[2] < mapTable.min.z - 1 || MISSION_VIEWS.map.camera[2] > mapTable.max.z + 1, 'map camera must stand outside the table');
    const mapWall = bounds('map-wall');
    const mapRoute = bounds('map-route');
    assert.ok(mapRoute.min.z > mapWall.max.z, 'map route must sit on the visible face of the wall');
    const handoff = bounds('handoff-box');
    assert.ok(MISSION_VIEWS.handoff.camera[2] < handoff.min.z - 1 || MISSION_VIEWS.handoff.camera[2] > handoff.max.z + 1, 'handoff camera must stand outside the box');
  } finally { model.dispose(); }
});

test('the world has a traversable corridor, explicit door openings, and enlarged room proportions', () => {
  const model = createMissionModel();
  try {
    assert.ok(model.root.getObjectByName('night-corridor'), 'shared night corridor');
    assert.ok(model.root.getObjectByName('door-radio-archive'), 'radio to archive doorway');
    assert.ok(model.root.getObjectByName('door-archive-analysis'), 'archive to analysis doorway');
    assert.ok(model.root.getObjectByName('door-analysis-machine'), 'analysis to machine doorway');
    assert.ok(model.root.getObjectByName('door-archive-handoff'), 'archive to handoff doorway');
    assert.ok(model.layout?.corridor, 'layout exposes corridor dimensions');
    for (const zone of model.zones) {
      assert.ok(zone.size[0] >= 7 && zone.size[1] >= 8, `${zone.id} should read as a room`);
      assert.ok(zone.group.getObjectByName(`doorway-${zone.id}`), `${zone.id} opens to the corridor`);
    }
    assert.ok(model.root.getObjectByName('bombe-secondary'), 'machine room has a second Bombe rack');
    assert.ok(model.anchors.bombeSecondary, 'second Bombe anchor is interactive');
  } finally { model.dispose(); }
});

test('room shells leave a visible passage between the working areas', () => {
  const model = createMissionModel();
  try {
    const corridor = model.root.getObjectByName('night-corridor');
    const box = new Box3().setFromObject(corridor);
    assert.ok(box.max.x - box.min.x > 30, 'corridor spans the night floor');
    assert.ok(box.max.z - box.min.z >= 2.4, 'corridor has walkable depth');
    for (const id of ['radio', 'archive', 'analysis', 'machine']) {
      const doorway = model.zones.find(zone => zone.id === id).group.getObjectByName(`doorway-${id}`);
      const doorBox = new Box3().setFromObject(doorway);
      assert.ok(doorBox.max.y - doorBox.min.y >= 2.2, `${id} door opening is human scale`);
    }
  } finally { model.dispose(); }
});

test('every declared doorway is physically clear and all seven rooms share a continuous floor', () => {
  const model = createMissionModel();
  try {
    assert.ok(model.portals?.length >= 10, 'room connectivity is an explicit graph');
    model.root.updateMatrixWorld(true);
    for (const portal of model.portals) {
      const start = new Vector3(...portal.start), end = new Vector3(...portal.end);
      const ray = new Raycaster(start, end.clone().sub(start).normalize(), 0, start.distanceTo(end));
      assert.equal(ray.intersectObjects(model.architectureWalls, false).length, 0, `${portal.id} has no solid wall across its opening`);
      const axis = end.clone().sub(start).normalize();
      const approach = new Raycaster(new Vector3(...portal.center).addScaledVector(axis, -1.55), axis, 0, 3.1);
      assert.equal(approach.intersectObject(model.root, true).length, 0, `${portal.id} is clear of furniture at standing height`);
    }
    const visited = new Set(['corridor']);
    for (let n = 0; n < 8; n++) for (const p of model.portals) {
      if (visited.has(p.from)) visited.add(p.to);
      if (visited.has(p.to)) visited.add(p.from);
    }
    assert.ok(model.zones.every(z => visited.has(z.id)), 'all rooms connect to the corridor');
    assert.equal(model.root.getObjectByName('corridor-ceiling'), undefined, 'cutaway inspection keeps the foreground open');
  } finally { model.dispose(); }
});

test('working furniture has legs, seats and recognizable equipment instead of solid placeholder blocks', () => {
  const model = createMissionModel();
  try {
    for (const id of ['entry-register', 'radio-console', 'analysis-table', 'map-table', 'handoff-desk']) {
      const table = model.root.getObjectByName(id);
      assert.ok(table?.getObjectByName('tabletop'), `${id} has a tabletop`);
      assert.equal(table.children.filter(c => c.name.startsWith('table-leg-')).length, 4, `${id} has four supporting legs`);
    }
    for (const name of ['receiver-dial', 'telephone-dial', 'telephone-handset', 'analysis-magnifier', 'map-coastline', 'machine-power-cabinet', 'maintenance-cart']) {
      assert.ok(model.root.getObjectByName(name), name);
    }
    assert.ok(model.anchors.bombeSecondary.userData.drumCount === 108, 'second rack reuses the detailed 108 drum exhibit');
    assert.ok(model.anchors.bombeSecondary.getObjectByName('drums').children.filter(c => c.isInstancedMesh).length >= 5, 'instancing must survive world batching');
    assert.ok(model.zones.machine.group.getObjectByName('machine-enigma'), 'settings controls have an Enigma in the machine room');
    assert.ok(model.zones.analysis.group.getObjectByName('verification-enigma'), 'continuous decoding has an Enigma in the verification room');
  } finally { model.dispose(); }
});
