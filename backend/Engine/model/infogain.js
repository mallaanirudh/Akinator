import { calculateLikelihood } from './likelihood.js';
export function calculateInformationGain(trait, characters, currentProbabilities, currentEntropy, possibleAnswers) {
let expectedEntropy = 0;
let totalAnswerProb = 0;


for (const answer of possibleAnswers) {
let answerProb = 0;
const conditional = {};


for (const char of characters) {
const charTrait = char.traits.find(t => t.traitId === trait.id);
const charValue = charTrait ? charTrait.value : 'UNKNOWN';
const likelihood = calculateLikelihood(answer, charValue, trait, characters);
const contribution = currentProbabilities[char.id] * likelihood;
conditional[char.id] = contribution;
answerProb += contribution;
}


if (answerProb > 1e-6) {
totalAnswerProb += answerProb;
// normalize and compute entropy
let condEntropy = 0;
for (const id in conditional) {
const prob = conditional[id] / answerProb;
if (prob > 1e-12) condEntropy -= prob * Math.log2(prob);
}
expectedEntropy += answerProb * condEntropy;
}
}


if (totalAnswerProb < 0.999) {
expectedEntropy += (1 - totalAnswerProb) * currentEntropy;
}


return Math.max(0, currentEntropy - expectedEntropy);
}