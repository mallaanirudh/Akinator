import { calculateProbabilities } from '../model/probabilities.js';
import { calculateEntropy } from '../model/entropy.js';
import { getAllCharactersWithTraits } from '../data/repositories/characterRepository.js';
import { getAnswersForSession } from '../data/repositories/answerRepository.js';


export async function getGameMetrics(sessionId) {
const [answers, characters] = await Promise.all([
getAnswersForSession(sessionId),
getAllCharactersWithTraits()
]);
if (!characters.length) return null;
const probabilities = calculateProbabilities(characters, answers);
const entropy = calculateEntropy(probabilities);
const maxProb = Math.max(...Object.values(probabilities));


return {
totalQuestions: answers.length,
characterCount: characters.length,
finalEntropy: entropy,
maxProbability: maxProb,
efficiency: answers.length > 0 ? entropy / answers.length : 0,
confidence: maxProb
};
}