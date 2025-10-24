import { getAllCharactersWithTraits } from '../data/repositories/characterRepository.js';
import { getAnswersForSession } from '../data/repositories/answerRepository.js';
import { getActiveTraits, getTraitQuestions } from '../data/repositories/traitRepository.js';
import { calculateProbabilities } from '../model/probabilities.js';
import { findBestNextTrait } from './selection.js';
import { getPossibleAnswers } from './possibleAnswers.js';
import { prisma } from '../../lib/prisma.js'; 

export async function getNextQuestion(sessionId) {
const [characters, answers, allTraits] = await Promise.all([
getAllCharactersWithTraits(),
getAnswersForSession(sessionId),
getActiveTraits()
]);


if (!characters.length) throw new Error('No characters available');


const asked = new Set(answers.map(a => a.traitId));
const remaining = allTraits.filter(t => !asked.has(t.id));
if (!remaining.length) return null;


const probabilities = calculateProbabilities(characters, answers);
const bestTrait = findBestNextTrait(remaining, characters, probabilities, answers);
if (!bestTrait) return null;


// formatting
const traitQuestions = await getTraitQuestions(bestTrait.id);
const questionText = traitQuestions.length ? traitQuestions[Math.floor(Math.random() * traitQuestions.length)].text :
(bestTrait.type === 'ENUM' ? `What is your character's ${bestTrait.displayName}?` : `Does your character have ${bestTrait.displayName}?`);


const possibleAnswers = await getPossibleAnswers(bestTrait);


return {
id: `trait-${bestTrait.id}`,
text: questionText,
type: bestTrait.type,
key: bestTrait.key,
displayName: bestTrait.displayName,
popularity: bestTrait.popularity,
infoValue: bestTrait.infoValue,
traitId: bestTrait.id,
possibleAnswers
};
}


export async function shouldMakeGuess(sessionId, maxQuestions = 20, confidenceThreshold = 0.75) {
const [answers, characters] = await Promise.all([
getAnswersForSession(sessionId),
getAllCharactersWithTraits()
]);


if (!characters.length) return true;
const probabilities = calculateProbabilities(characters, answers);
const maxProbability = Math.max(...Object.values(probabilities));
const entropy = (Object.values(probabilities).length ? (await import('../model/entropy.js')).calculateEntropy(probabilities) : 0);


if (answers.length >= maxQuestions) return true;
}
export async function getMostLikelyCharacter(sessionId) {
  try {
    const [characters, answers] = await Promise.all([
      prisma.character.findMany({
        include: { 
          traits: { 
            include: { trait: true } 
          } 
        }
      }),
      prisma.answerLog.findMany({ 
        where: { sessionId } 
      })
    ]);

    const probabilities = calculateProbabilities(characters, answers);
    const topChoices = getTopChoices(probabilities, characters, 5);
    const bestGuess = topChoices[0];
    
    return {
      guess: bestGuess,
      topChoices: topChoices.slice(0, 3), // Return top 3 for display
      metrics: {
        totalQuestions: answers.length,
        entropy: calculateEntropy(probabilities),
        confidence: bestGuess?.probability || 0,
        characterCount: characters.length
      }
    };
  } catch (error) {
    console.error("Error in getMostLikelyCharacter:", error);
    throw error;
  }
}
export async function updateTraitStatistics(sessionId, correctCharacterId) {
  try {
    const [answers, characters] = await Promise.all([
      prisma.answerLog.findMany({
        where: { sessionId },
        include: { trait: true },
        orderBy: { answeredAt: 'asc' }
      }),
      prisma.character.findMany({
        include: { traits: { include: { trait: true } } }
      })
    ]);
    
    const maxEntropy = Math.log2(Math.max(characters.length, 2));
    const updates = [];
    
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      
      // Calculate entropy reduction (simplified)
      const earlyBonus = Math.max(0, (10 - i) * 0.015);
      const infoValueIncrement = 0.03 + earlyBonus;
      const popularityIncrement = 0.008;
      
      updates.push(
        prisma.trait.update({
          where: { id: answer.traitId },
          data: {
            infoValue: { increment: infoValueIncrement },
            popularity: { increment: popularityIncrement }
          }
        })
      );
    }
    
    // Execute all updates in parallel
    await Promise.all(updates);
    
  } catch (error) {
    console.error("Error updating trait statistics:", error);
  }
}