import { calculateEntropy } from '../model/entropy.js';
import { calculateInformationGain } from '../model/infogain.js';
import { getPossibleAnswers } from './possibleAnswers.js';


export function findBestNextTrait(remainingTraits, characters, currentProbabilities, answers) {
if (!remainingTraits.length) return null;
const currentEntropy = calculateEntropy(currentProbabilities);
const isStart = answers.length < 3;
const isMid = answers.length >= 3 && answers.length < 10;


let best = null;
let bestScore = -Infinity;


for (const trait of remainingTraits) {
let score;
if (isStart) {
// bias toward informative/popular traits early
score = (trait.infoValue || 0.5) * 10 + (trait.popularity || 0.3) * 5;
} else {
const possibleAnswers = getPossibleAnswers(trait, characters);
const infoGain = calculateInformationGain(trait, characters, currentProbabilities, currentEntropy, possibleAnswers);
const valueBonus = (trait.infoValue || 0.5) * (isMid ? 1.5 : 1);
score = infoGain + valueBonus - ((trait.popularity || 0.1) < 0.03 ? 2 : 0);
}


if (score > bestScore) {
bestScore = score;
best = trait;
}
}


return best;
}