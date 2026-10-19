/** Shared spatial contract for the 04 night-shift floor. Display units, not surveyed CAD dimensions. */
export const MISSION_WORLD_LAYOUT = Object.freeze({
  corridor: Object.freeze({ position: [2, 0, 6], size: [46, 3], ceiling: 3.8 }),
  zones: Object.freeze([
    Object.freeze({ id: 'entry', pos: [-17, 0, 0], size: [8, 9], tone: '#6a7771', title: 'NIGHT RECEPTION' }),
    Object.freeze({ id: 'radio', pos: [-9, 0, 0], size: [8, 9], tone: '#67796e', title: 'WIRELESS ROOM' }),
    Object.freeze({ id: 'archive', pos: [0, 0, 0], size: [10, 9], tone: '#727c74', title: 'RECORDS & ENIGMA' }),
    Object.freeze({ id: 'analysis', pos: [9, 0, 0], size: [8, 9], tone: '#6e7970', title: 'ANALYSIS ROOM' }),
    Object.freeze({ id: 'machine', pos: [19, 0, 0], size: [12, 9], tone: '#69766c', title: 'BOMBE ROOM' }),
    Object.freeze({ id: 'map', pos: [9, 0, -9], size: [8, 9], tone: '#6b7c7e', title: 'NORTH HARBOR' }),
    Object.freeze({ id: 'handoff', pos: [0, 0, -9], size: [10, 9], tone: '#7e7e6f', title: 'DUTY HANDOFF' }),
  ]),
  connections: Object.freeze([
    ...[['entry', -17], ['radio', -9], ['archive', 0], ['analysis', 9], ['machine', 19]].map(([to, x]) => Object.freeze({ id: `corridor-${to}`, from: 'corridor', to, center: [x, 1.3, 4.5], axis: 'z' })),
    Object.freeze({ id: 'door-entry-radio', from: 'entry', to: 'radio', center: [-13, 1.3, 0], axis: 'x' }),
    Object.freeze({ id: 'door-radio-archive', from: 'radio', to: 'archive', center: [-5, 1.3, 0], axis: 'x' }),
    Object.freeze({ id: 'door-archive-analysis', from: 'archive', to: 'analysis', center: [5, 1.3, 0], axis: 'x' }),
    Object.freeze({ id: 'door-analysis-machine', from: 'analysis', to: 'machine', center: [13, 1.3, 0], axis: 'x' }),
    Object.freeze({ id: 'door-archive-handoff', from: 'archive', to: 'handoff', center: [0, 1.3, -4.5], axis: 'z' }),
    Object.freeze({ id: 'door-analysis-map', from: 'analysis', to: 'map', center: [9, 1.3, -4.5], axis: 'z' }),
    Object.freeze({ id: 'door-handoff-map', from: 'handoff', to: 'map', center: [5, 1.3, -9], axis: 'x' }),
  ]),
});

export const MISSION_ZONE_IDS = MISSION_WORLD_LAYOUT.zones.map(zone => zone.id);
