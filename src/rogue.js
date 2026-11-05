import { createRogueRunView } from './rogue-run.js';

export function createRogue(root, options = {}) {
  return createRogueRunView(root, { ...options, standalone: true });
}
