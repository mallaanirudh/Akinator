//import { CONFIG } from '../config/index.js';
import { normalizeUserAnswer, normalizeTraitValue } from '../utils/normalization.js';
import { getValueFrequency } from './frequency.js';


/**
* Deterministic, documented likelihood function.
* Returns P(answer | charValue, trait)
*/
export function calculateLikelihood(userAnswer, charValue, trait, characters = []) {
const normalizedAnswer = normalizeUserAnswer(userAnswer);
const normalizedCharValue = normalizeTraitValue(charValue);


if (normalizedAnswer === 'UNKNOWN') return 0.5;
if (normalizedCharValue === 'UNKNOWN') return 0.3;


if (trait?.type === 'ENUM') {
const freq = getValueFrequency(trait.id, normalizedCharValue, characters);
if (normalizedCharValue === normalizedAnswer) {
// matching value, rarer values yield slightly higher likelihood to reward specificity
return Math.min(0.95, 0.65 + 0.3 * (1 - freq));
} else {
// non-match depends on how common the charValue is: common values penalize more
return Math.max(0.05, 0.2 * freq);
}
}


if (trait?.type === 'BOOLEAN') {
const isTrue = normalizedCharValue === 'TRUE';
switch (normalizedAnswer) {
case 'TRUE': return isTrue ? CONFIG.LIKELIHOOD.BOOLEAN.TRUE_MATCH : CONFIG.LIKELIHOOD.BOOLEAN.TRUE_MISMATCH;
case 'FALSE': return isTrue ? CONFIG.LIKELIHOOD.BOOLEAN.TRUE_MISMATCH : CONFIG.LIKELIHOOD.BOOLEAN.TRUE_MATCH;
case 'PROBABLY_YES': return isTrue ? CONFIG.LIKELIHOOD.BOOLEAN.PROBABLY_YES : (1 - CONFIG.LIKELIHOOD.BOOLEAN.PROBABLY_YES);
case 'PROBABLY_NO': return isTrue ? CONFIG.LIKELIHOOD.BOOLEAN.PROBABLY_NO : (1 - CONFIG.LIKELIHOOD.BOOLEAN.PROBABLY_NO);
default: return 0.5;
}
}


// Default fallback
return 0.5;
}