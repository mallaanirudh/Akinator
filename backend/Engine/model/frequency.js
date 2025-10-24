//import { CONFIG } from '../config/index.js';
import { normalizeTraitValue } from '../utils/normalization.js';


export function getValueFrequency(traitId, value, characters) {
// characters: array of { id, traits: [{ traitId, value }] }
const total = characters.length;
if (total === 0) return 0.5;


const normalizedValue = normalizeTraitValue(value);
let matches = 0;
for (const char of characters) {
if (char.traits.some(t => t.traitId === traitId && normalizeTraitValue(t.value) === normalizedValue)) {
matches++;
}
}
const { ALPHA, BETA } = CONFIG.SMOOTHING;
return (matches + ALPHA) / (total + BETA);
}