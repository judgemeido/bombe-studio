import * as THREE from 'three';
import { createMissionProps } from './mission-props.js';
import { createProduct } from './model.js';

/** Furnish the connected floor using actual assemblies and working surfaces. */
export function createMissionRoomContents(craft, mats, zones, anchors, apparatus) {
  const { box, cylinder, cable, text, mesh } = craft;
  const { wood, walnut, dark, steel, brass, ivory, green, rubber, copper, paperMat, leather } = mats;
  const { radio, enigma, checker, desk, phones, windowGroup, lamp, papers, cup, pencil } = apparatus;
  const props = createMissionProps(craft, mats);
  const zoneById = id => zones.find(zone => zone.id === id);
  const interactives = [];
  const deviceCopies = [];
  function copyEnigma(name, parent, position, scale) {
    const copy = enigma.clone(true); copy.name = name; copy.position.set(...position); copy.scale.setScalar(scale); parent.add(copy);
    enigma.traverse(source => {
      if (source !== enigma && source.isGroup && source.name) {
        const target = copy.getObjectByName(source.name); if (target) deviceCopies.push({ source, target });
      }
    });
    interactives.push(copy); return copy;
  }
  function mount(object, zoneId, position, rotationY = 0) {
    object.removeFromParent(); zoneById(zoneId).group.add(object);
    object.position.set(...position); object.rotation.y = rotationY; return object;
  }
  function frontCylinder(r, depth, pos, mat, parent, segments = 32) {
    const c = cylinder(r, depth, pos, mat, parent, segments); c.rotation.x = Math.PI / 2; return c;
  }
  const entry = zoneById('entry').group, radioRoom = zoneById('radio').group;
  const archive = zoneById('archive').group, analysis = zoneById('analysis').group;
  const machine = zoneById('machine').group, mapRoom = zoneById('map').group, handoff = zoneById('handoff').group;
  const entryDesk = props.table('entry-register', [0, 0, .35], entry, 3.7, 1.9);
  const entryRegisterBook = props.papers('entry-register-book', [-.35, 1.08, .45], entry, 'NIGHT DUTY / 05:42\nFOG AT NORTH HARBOR\nSIGN / CHECK / HANDOFF', 1.45, 1.0);
  box([.06, .03, .95], [-.35, 1.15, .45], leather, entry);
  const entryChair = props.chair('entry-chair', [.1, 0, -1.35], entry);
  props.deskLamp('entry-lantern', [-1.25, 1.08, .4], entry, .95);
  props.phone('entry-phone', [1.05, 1.08, .25], entry);
  const coatRack = props.group('entry-coat-rack', [-2.9, 0, -2.5], entry);
  cylinder(.055, 2.65, [0, 1.02, 0], walnut, coatRack);
  for (const x of [-.4, .4]) { const h = cylinder(.035, .6, [x / 2, 2.05, 0], brass, coatRack); h.rotation.z = Math.sign(x) * .8; }
  for (const yaw of [0, Math.PI / 2]) box([.8, .07, .12], [0, -.2, 0], wood, coatRack).rotation.y = yaw;
  props.cabinet('entry-locker', [2.85, 0, -3.5], entry, 1.3, 2.45);

  const radioDesk = props.table('radio-console', [0, 0, -.1], radioRoom, 5.7, 2.1);
  const radioMachine = props.group('radioMachine', [-1.28, 1.65, -.3], radioRoom);
  radio.removeFromParent(); radioMachine.add(radio); radio.position.set(0, 0, 0); radio.rotation.y = 0;
  radioMachine.scale.setScalar(1.25);
  const receiverTwo = radioMachine.clone(true); receiverTwo.name = 'radioMachine-secondary';
  receiverTwo.position.set(.8, 1.65, -.3); radioRoom.add(receiverTwo);
  const secondNeedle = receiverTwo.getObjectByName('radio-needle'); if (secondNeedle) secondNeedle.name = 'receiver-dial';
  mount(phones, 'radio', [-1.1, 1.08, .75]);
  mount(windowGroup, 'radio', [-2.2, 2.2, -4.34]); windowGroup.scale.setScalar(.74);
  props.papers('radio-log', [1.6, 1.08, .65], radioRoom, 'INTERCEPT LOG\n05:42 / 550\nDX ... WETTER', 1.05, .7);
  props.chair('radio-chair', [-.25, 0, 1.9], radioRoom, Math.PI);
  props.deskLamp('radio-copy-lamp', [-2.4, 1.08, .5], radioRoom);
  const antenna = props.group('radio-antenna', [2.5, 1.08, -.5], radioRoom);
  cylinder(.12, .035, [0, 0, 0], steel, antenna); cylinder(.012, 1.65, [0, .82, 0], brass, antenna);
  cable([[2.1, 1.3, -.7], [2.65, .3, -.9], [2.7, -.25, -2.7]], .016, rubber, radioRoom);

  mount(desk, 'archive', [0, .95, .35]);
  mount(enigma, 'archive', [-.2, 1.18, .45]); enigma.scale.setScalar(1.16);
  mount(lamp, 'archive', [1.55, 1.08, .85]);
  mount(papers, 'archive', [2.05, 1.09, .85], -.13);
  mount(cup, 'archive', [-1.75, 1.18, -.5]);
  mount(pencil, 'archive', [2.5, 1.12, .65]);
  const archiveCabinet = props.cabinet('archive-cabinet', [-3.8, 0, -2.9], archive, 1.4, 2.8);
  props.cabinet('archive-cabinet-east', [3.8, 0, -2.9], archive, 1.4, 2.8);
  const archiveWall = props.group('archive-wall-records', [3, 2.05, -4.32], archive);
  box([2.4, 1.75, .1], [0, 0, 0], leather, archiveWall, .018);
  for (let i = 0; i < 6; i++) {
    const card = props.group(`archive-card-${i}`, [-.75 + i % 3 * .75, .4 - Math.floor(i / 3) * .8, .08], archiveWall);
    text(['CALL / 05:12', 'WX / 05:27', 'DX / 05:42'][i % 3], .6, .55, [0, 0, 0], card, { background: '#d6c9a9', color: '#344438' });
    frontCylinder(.025, .02, [0, .23, .015], brass, card, 12);
  }
  props.chair('archive-chair', [-1.9, 0, 2.4], archive, Math.PI);

  const analysisTable = props.table('analysis-table', [0, 0, .3], analysis, 5.15, 2.4);
  const analysisBoard = props.group('analysis-board', [.1, 2, -3.3], analysis);
  box([3.8, 1.9, .1], [0, 0, 0], leather, analysisBoard, .025);
  for (const x of [-1.92, 1.92]) box([.07, 2.05, .13], [x, 0, 0], walnut, analysisBoard);
  for (const y of [-1, 1]) box([3.9, .07, .13], [0, y, 0], walnut, analysisBoard);
  text('WETTER / RELATION MENU', 2.55, .25, [0, .68, .065], analysisBoard, { background: '#273e36', color: '#dbc99d' });
  const nodePositions = [[-1.25, .15, .1], [-.5, -.4, .1], [.4, .12, .1], [1.3, -.4, .1]];
  nodePositions.forEach((p, i) => {
    text(['W / D', 'E / X', 'T / G', 'R / A'][i], .55, .33, p, analysisBoard, { background: '#d2c6a6', color: '#273e36' });
    if (i) cable([nodePositions[i - 1], [(p[0] + nodePositions[i - 1][0]) / 2, .2, .15], p], .012, copper, analysisBoard);
  });
  // Keep the rear doorway and its approach open; the relation board hangs on
  // the wall beside it instead of standing across the connection to the map room.
  analysisBoard.position.set(2.65, 2.1, -4.27); analysisBoard.scale.setScalar(.66);
  const analysisFileStack = props.papers('analysis-file-stack', [-1.5, 1.08, .55], analysis, 'CRIB / WETTER\nALIGNMENT / CHECK', 1.1, .8);
  const alignmentFrame = props.group('alignment-frame', [.75, 1.1, .45], analysis);
  box([2.15, .025, 1.0], [0, 0, 0], paperMat, alignmentFrame, .01);
  for (const z of [-.44, .44]) box([2.3, .035, .045], [0, .02, z], brass, alignmentFrame);
  text('D X  W E T T E R\n     W E T T E R', 2.0, .65, [0, .02, 0], alignmentFrame, { flat: true, background: '#cfc4a1', color: '#344438' });
  alignmentFrame.position.x = -.55; alignmentFrame.scale.setScalar(.65);
  analysisFileStack.position.x = -1.8; analysisFileStack.scale.setScalar(.8);
  copyEnigma('verification-enigma', analysis, [1.25, 1.13, .3], .65);
  props.magnifier([-2.15, 1.08, -.25], analysis);
  props.deskLamp('analysis-lamp', [2, 1.08, -.25], analysis, 1.15);
  props.chair('analysis-chair', [-.5, 0, 2.2], analysis, Math.PI);

  // Chapter 01 already contains a detailed assembly with instanced drum faces,
  // transmission, rear sockets, menu cables and motor. Keep its ownership intact.
  const bombeProduct = createProduct(), secondProduct = createProduct();
  const bombe = bombeProduct.root, bombeSecondary = secondProduct.root;
  bombe.name = 'bombe'; bombeSecondary.name = 'bombe-secondary';
  for (const [rack, x, angle] of [[bombe, -2.25, -.055], [bombeSecondary, 2.25, .055]]) {
    machine.add(rack); rack.scale.setScalar(.49); rack.position.set(x, -.29, -1.15); rack.rotation.y = angle;
    rack.userData.drumCount = 108;
  }
  const machinePanel = props.group('machine-panel', [4.5, 1.45, -3.75], machine);
  box([1.6, 2.75, .35], [0, 0, 0], green, machinePanel, .045);
  for (let i = 0; i < 4; i++) frontCylinder(.1, .045, [-.5 + i * .33, .65, .2], i === 1 ? ivory : brass, machinePanel);
  const machineConsole = props.table('machine-console', [0, 0, 1.7], machine, 3.5, 1.2);
  props.table('machine-enigma-bench', [-4.3, 0, 1.15], machine, 2.7, 2.25);
  copyEnigma('machine-enigma', machine, [-4.3, 1.16, 1.15], .85);
  props.papers('machine-setting-sheet', [.4, 1.08, 1.8], machine, 'STOP / B D F\nVERIFY BEFORE RELEASE', 1.4, .65);
  mount(checker, 'machine', [-1.25, 1.52, 1.52]); checker.scale.setScalar(.4);
  const powerCabinet = props.cabinet('machine-power-cabinet', [-4.8, 0, -3.4], machine, 1.3, 2.55, .8);
  const cart = props.group('maintenance-cart', [4.65, 0, 1.7], machine);
  for (const y of [.1, .9]) box([1.25, .08, .85], [0, y, 0], steel, cart, .02);
  for (const x of [-.52, .52]) for (const z of [-.32, .32]) {
    box([.04, .95, .04], [x, .48, z], steel, cart);
    const wheel = cylinder(.1, .06, [x, -.18, z], rubber, cart, 20); wheel.rotation.z = Math.PI / 2;
  }
  for (let i = 0; i < 3; i++) frontCylinder(.12, .16, [-.35 + i * .35, 1.07, .12], [brass, green, copper][i], cart, 24);
  text('MAINTENANCE', 1, .12, [0, .71, .45], cart, { background: '#87918a', color: '#26382d' });

  const mapWall = props.group('map-wall', [0, 2.0, -3.35], mapRoom);
  box([5.6, 2.65, .14], [0, 0, 0], walnut, mapWall, .025);
  box([5.35, 2.42, .03], [0, 0, .095], paperMat, mapWall);
  const coastline = props.group('map-coastline', [0, 0, .13], mapWall);
  cable([[-.95, 1.04, 0], [-1.18, .75, 0], [-.95, .55, 0], [-1.3, .1, 0], [-1.55, -.1, 0], [-1.2, -.45, 0], [-1.15, -.82, 0], [-.8, -1.04, 0]], .025, leather, coastline);
  cable([[1.75, 1.08, 0], [1.4, .65, 0], [1.65, .3, 0], [1.3, .05, 0], [1.45, -.3, 0], [.9, -.7, 0], [.55, -1.08, 0]], .026, leather, coastline);
  for (let x = -2.4; x <= 2.4; x += .6) box([.006, 2.25, .008], [x, 0, .015], copper, coastline);
  for (let y = -1.05; y <= 1.05; y += .35) box([5.1, .006, .008], [0, y, .015], copper, coastline);
  text('NORTH SEA / DUTY CHART', 2.8, .2, [0, 1.06, .15], mapWall, { background: '#cfc4a1', color: '#344438' });
  const mapRoute = props.group('map-route', [-.25, 1.8, -3.15], mapRoom);
  cable([[-.9, -.65, 0], [-.45, -.2, 0], [.15, .14, 0], [.9, .75, 0]], .024, copper, mapRoute);
  for (const [x,y] of [[-.9,-.65],[-.45,-.2],[.15,.14],[.9,.75]]) frontCylinder(.045, .025, [x, y, .03], brass, mapRoute, 16);
  const mapPin = props.group('map-pin', [-.1, 1.94, -3.08], mapRoom);
  frontCylinder(.04, .12, [0, 0, 0], brass, mapPin, 16); mesh(new THREE.SphereGeometry(.075, 16, 12), copper, [0, 0, .09], mapPin);
  props.table('map-table', [0, 0, .5], mapRoom, 4.4, 2.0);
  props.papers('map-tide-strip', [-.9, 1.08, .5], mapRoom, 'NORTH HARBOR\n05:42 / FOG\nTIDE / CHECK', 1.35, 1.0);
  props.papers('map-lookout-log', [.8, 1.08, .65], mapRoom, 'LOOKOUT REPORT\nWINDOW UNCONFIRMED', 1.15, .8);
  props.deskLamp('map-lamp', [1.6, 1.08, .1], mapRoom);
  props.phone('map-phone', [-1.55, 1.08, .1], mapRoom);
  props.chair('map-chair', [0, 0, 2.1], mapRoom, Math.PI);

  props.table('handoff-desk', [0, 0, .1], handoff, 4.7, 2.1);
  const handoffBox = props.group('handoff-box', [-1.25, 1.08, -.3], handoff);
  box([1.35, .36, .85], [0, .18, 0], leather, handoffBox, .035);
  box([1.39, .065, .89], [0, .385, 0], dark, handoffBox, .02);
  box([.17, .13, .035], [0, .24, .45], brass, handoffBox, .012);
  for (const x of [-.55, .55]) box([.04, .36, .035], [x, .18, .44], brass, handoffBox);
  text('SEALED / B D F', .9, .13, [0, .3, .456], handoffBox);
  const handoffForm = props.papers('handoff-form', [-.25, 1.08, .5], handoff, 'DUTY HANDOFF\nB D F / 05:42\nHOLD UNTIL VERIFIED', 1.5, 1.05);
  const handoffPhone = props.phone('handoff-phone', [1.45, 1.08, -.3], handoff);
  const handoffChair = props.chair('handoff-chair', [-1.1, 0, 2], handoff, Math.PI);
  props.chair('handoff-chair-second', [1.25, 0, 2], handoff, Math.PI);
  props.deskLamp('handoff-lamp', [-2, 1.08, .1], handoff);
  props.cabinet('handoff-record-cabinet', [-3.7, 0, -3.4], handoff, 1.35, 2.5);
  Object.assign(anchors, { enigma, radioMachine, bombe, bombeSecondary, papers, desk, lamp, entryDesk, radioDesk, analysisBoard, machinePanel, mapWall, handoffBox, entryRegisterBook, entryChair, analysisFileStack, machineConsole, mapRoute, mapPin, handoffForm, handoffChair });
  interactives.push(entryDesk, entryRegisterBook, entryChair, receiverTwo, archiveCabinet, archiveWall, analysisTable, analysisBoard, analysisFileStack, alignmentFrame, bombe, bombeSecondary, machinePanel, machineConsole, powerCabinet, cart, mapWall, mapRoute, mapPin, handoffBox, handoffForm, handoffPhone, handoffChair);
  return { interactives, update(dt, running) {
    bombeProduct.update(dt, running); secondProduct.update(dt, running);
    deviceCopies.forEach(({ source, target }) => { target.position.copy(source.position); target.rotation.copy(source.rotation); target.visible = source.visible; });
  }, dispose() { bombeProduct.dispose(); secondProduct.dispose(); } };
}
