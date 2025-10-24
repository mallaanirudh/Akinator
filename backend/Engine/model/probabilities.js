import { calculateLikelihood } from './likelihood.js';


// Calculates posterior-like scores for characters given answers.
 //This implementation uses iterative multiplication and normalization.
 //Deterministic tie-breaking: uses character id ordering.

export function calculateProbabilities(characters, answers) {
const totalCharacters = characters.length;
if (totalCharacters === 0) return {};


const probabilities = {};
const initialProb = 1 / totalCharacters;
// deterministic initialization
characters.sort((a, b) => (a.id > b.id ? 1 : -1));
for (const char of characters) probabilities[char.id] = initialProb;


const EPS = 1e-12;


for (const answer of answers) {
const traitId = answer.traitId;
const userAnswer = answer.answer;


let totalWeight = 0;
const newProbs = {};


for (const char of characters) {
const charTrait = char.traits.find(t => t.traitId === traitId);
const charValue = charTrait ? charTrait.value : 'UNKNOWN';
const trait = charTrait?.trait || { id: traitId, type: 'STRING' };


const likelihood = calculateLikelihood(userAnswer, charValue, trait, characters);
newProbs[char.id] = probabilities[char.id] * likelihood;
totalWeight += newProbs[char.id];
}


if (totalWeight < EPS) {
// All weights zero-ish: reinitialize evenly to avoid collapse
const uniform = 1 / totalCharacters;
for (const char of characters) probabilities[char.id] = uniform;
} else {
for (const char of characters) {
probabilities[char.id] = (newProbs[char.id] + EPS) / (totalWeight + EPS * totalCharacters);
}
}
}


return probabilities;
}