import { MISSION } from './mission-engine.js';
import { encipher, pressKey } from './cipher.js';

/** A pure projection of the paused simulation clock, shared by every render. */
export function missionFrame(state, clock, { searchStart = null, decodeStart = null, reduced = false } = {}) {
  const playing = state.phase === 'playing';
  const modern = Number.isInteger(state.beat);
  const beat = modern ? state.beat : state.stage || 0;
  const searchBeat = modern ? 9 : 4;
  const decodeBeat = modern ? 11 : 5;
  const searchProgress = playing && beat === searchBeat && searchStart !== null && clock - searchStart < 3.4 ? Math.min(25, Math.floor((clock - searchStart) / 3.4 * 26)) : null;
  let positions = beat >= decodeBeat ? [1, 3, 5] : state.positions, inputLetter = null, outputLetter = null;
  if (searchProgress !== null && !reduced) positions = [1, 3, searchProgress];
  if (playing && beat === decodeBeat && decodeStart !== null && state.decoded) {
    const index = reduced ? MISSION.ciphertext.length - 1 : Math.min(MISSION.ciphertext.length - 1, Math.max(0, Math.floor((clock - decodeStart) * 6)));
    const prior = encipher(MISSION.ciphertext.slice(0, index), [1, 3, 5], MISSION.pairs).positions;
    const result = pressKey(MISSION.ciphertext[index], prior, MISSION.pairs);
    positions = result.positions; inputLetter = result.input; outputLetter = result.output;
  }
  return { positions, inputLetter, outputLetter, searchProgress };
}
