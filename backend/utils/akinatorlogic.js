import { prisma } from "../lib/prisma.js";
//HELPER FUNCTION ---------------------------------------
async function getPossibleAnswers(trait, characters) {
  if (trait.type === 'BOOLEAN') {
    return ['TRUE', 'FALSE', 'UNKNOWN'];
  } else if (trait.type === 'ENUM') {
    // Get actual distinct values from characters for this trait
    const values = characters
      .flatMap(c => c.traits)
      .filter(t => t.traitId === trait.id)
      .map(t => t.value)
      .filter(v => v && v !== 'UNKNOWN');
    
    const uniqueValues = [...new Set(values)];
    return uniqueValues.length > 0 ? [...uniqueValues, 'UNKNOWN'] : ['UNKNOWN'];
  }
  return ['UNKNOWN'];
}
function getValueFrequency(traitId, value, characters) {
  const total = characters.length;
  const matches = characters.filter(c => 
    c.traits.some(t => t.traitId === traitId && t.value === value)
  ).length;
  return (matches + 1) / (total + 1); // Laplace smoothing
}
//----------------------------------
// Add this normalization function
function normalizeUserAnswer(answer) {
  const mapping = {
    'YES': 'TRUE',
    'NO': 'FALSE',
    'SOMETIMES': 'PROBABLY_YES', 
    'UNKNOWN': 'UNKNOWN',
    'IDK': 'UNKNOWN',
    'PROBABLY': 'PROBABLY_YES',
    'PROBABLY_NOT': 'PROBABLY_NO'
  };
  return mapping[answer.toUpperCase()] || 'UNKNOWN';
}

// Update your submitAnswer to use normalized answers
await prisma.answerLog.create({
  data: { 
    sessionId, 
    traitId: finalTraitId,
    questionId: finalQuestionId,
    answer: answer.toUpperCase(), // Store original
    normalized: normalizeUserAnswer(answer), // Store normalized
    isFallback: isFallbackQuestion
  }
});
/**
 * Helper to get possible values for an enum trait from database
 */
async function getTraitPossibleValues(traitId) {
  const characterTraits = await prisma.characterTrait.findMany({
    where: { traitId },
    select: { value: true }
  });
  
  const values = [...new Set(characterTraits.map(ct => ct.value))]
    .filter(v => v && v !== 'UNKNOWN');
  
  return values;
}
/**
 * Calculate likelihood of an answer given character's trait value
 * Supports boolean, enum, and fuzzy answers
 */
function calculateLikelihood(userAnswer, charValue, trait, characters = []) {
  const normalizedAnswer = normalizeUserAnswer(userAnswer);
  const normalizedCharValue = charValue?.toUpperCase()?.trim() || 'UNKNOWN';

  if (normalizedAnswer === 'UNKNOWN') return 0.5;
  if (normalizedCharValue === 'UNKNOWN') return 0.3;

  const SMOOTH_TRUE = 0.65;
  const SMOOTH_FALSE = 0.35;
  let likelihood = 0.5;

  if (trait?.type === 'ENUM') {
    const freq = getValueFrequency(trait.id, normalizedCharValue, characters);
    likelihood = normalizedCharValue === normalizedAnswer
      ? Math.min(0.7 / freq, 0.9)
      : Math.max(0.3 * freq, 0.1);
  }

  else if (trait?.type === 'BOOLEAN') {
    const isTrue = normalizedCharValue === 'TRUE';
    switch (normalizedAnswer) {
      case 'TRUE': likelihood = isTrue ? SMOOTH_TRUE : SMOOTH_FALSE; break;
      case 'FALSE': likelihood = isTrue ? SMOOTH_FALSE : SMOOTH_TRUE; break;
      case 'PROBABLY_YES': likelihood = isTrue ? 0.6 : 0.4; break;
      case 'PROBABLY_NO': likelihood = isTrue ? 0.4 : 0.6; break;
      default: likelihood = 0.5;
    }
  }

  return likelihood;
}

export async function formatQuestion(trait) {
  try {
    // Try to get specific questions from the questions table
    const traitQuestions = await prisma.question.findMany({
      where: { 
        traitId: trait.id,
        active: true 
      }
    });

    if (traitQuestions.length > 0) {
      const randomQuestion = traitQuestions[Math.floor(Math.random() * traitQuestions.length)];
      return {
        id: randomQuestion.id,
        text: randomQuestion.text,
        type: trait.type,
        key: trait.key,
        displayName: trait.displayName,
        popularity: trait.popularity,
        infoValue: trait.infoValue,
        traitId: trait.id,
        possibleAnswers: trait.type === 'ENUM' ? 
          await getTraitPossibleValues(trait.id) : undefined
      };
    }

    // Fallback questions with better enum support
    const specificQuestions = {
      // Boolean traits
      'Super Strength': 'Does your character have super strength?',
      'Flight': 'Can your character fly?',
      'Super Speed': 'Is your character super fast?',
      'Super Intelligence': 'Is your character super intelligent?',
      'Super Durability': 'Is your character super durable?',
      
      // Enum traits - ask for specific values
      'alignment': 'What is your character\'s alignment?',
      'gender': 'What is your character\'s gender?',
      'species': 'What species is your character?',
      'occupation': 'What is your character\'s occupation?',
      'origin': 'What is your character\'s origin?',
      'affiliation': 'What group is your character affiliated with?'
    };
    
    const questionText = specificQuestions[trait.key] || 
      specificQuestions[trait.displayName] || 
      (trait.type === 'ENUM' ? 
        `What is your character's ${trait.displayName}?` :
        `Does your character have ${trait.displayName}?`);
    
    return {
      id: `temp-${trait.id}`,
      text: questionText,
      type: trait.type,
      key: trait.key,
      displayName: trait.displayName,
      popularity: trait.popularity,
      infoValue: trait.infoValue,
      traitId: trait.id,
      possibleAnswers: trait.type === 'ENUM' ? 
        await getTraitPossibleValues(trait.id) : undefined
    };
  } catch (error) {
    console.error("Error formatting question:", error);
    return {
      id: trait.id,
      text: `Does your character have ${trait.displayName}?`,
      type: trait.type,
      key: trait.key,
      displayName: trait.displayName,
      popularity: trait.popularity,
      infoValue: trait.infoValue,
      traitId: trait.id
    };
  }
}

/**
 * Calculate probabilities using Naive Bayes with improved likelihood modeling
 */
export function calculateProbabilities(characters, answers) {
  const totalCharacters = characters.length;
  const probabilities = {};
  
  // Initial uniform probability
  const initialProb = 1 / totalCharacters;
  characters.forEach(char => {
    probabilities[char.id] = initialProb;
  });

  // Update probabilities based on answers
  answers.forEach(answer => {
    const traitId = answer.traitId;
    const userAnswer = answer.answer;
    
    let totalWeight = 0;
    const newProbabilities = {};
    
    characters.forEach(char => {
      const charTrait = char.traits.find(t => t.traitId === traitId);
      const charValue = charTrait ? charTrait.value : 'UNKNOWN';
      const trait = charTrait?.trait;
      
      // Calculate likelihood using improved model
      const likelihood = calculateLikelihood(userAnswer, charValue, trait);
      
      newProbabilities[char.id] = probabilities[char.id] * likelihood;
      totalWeight += newProbabilities[char.id];
    });
    
    // Normalize probabilities
    const EPS = 1e-6;
    if (totalWeight > EPS) {
  characters.forEach(char => {
    probabilities[char.id] = (newProbabilities[char.id] + EPS) / (totalWeight + EPS * characters.length);
  });
}

  });
  
  return probabilities;
}

/**
 * Calculate entropy of probability distribution
 */
export function calculateEntropy(probabilities) {
  let entropy = 0;
  for (const prob of Object.values(probabilities)) {
    if (prob > 0 && prob < 1) {
      entropy -= prob * Math.log2(prob);
    }
  }
  return entropy;
}

/**
 * Calculate information gain for a trait with proper enum support
 */
export function calculateInformationGain(trait, characters, currentProbabilities, currentEntropy, possibleAnswers) {
  let expectedEntropy = 0;
  
  for (const answer of possibleAnswers) {
    // Calculate probability of getting this answer
    let answerProb = 0;
    const conditionalProbs = {};
    
    characters.forEach(char => {
      const charTrait = char.traits.find(t => t.traitId === trait.id);
      const charValue = charTrait ? charTrait.value : 'UNKNOWN';
      const likelihood = calculateLikelihood(answer, charValue, trait);
      
      // Weight by current probability
      const contribution = currentProbabilities[char.id] * likelihood;
      answerProb += contribution;
      conditionalProbs[char.id] = contribution;
    });
    
    if (answerProb > 0.01) { // Only consider likely answers
      // Normalize conditional probabilities
      let sum = 0;
      Object.values(conditionalProbs).forEach(p => sum += p);
      
      if (sum > 0) {
        Object.keys(conditionalProbs).forEach(charId => {
          conditionalProbs[charId] /= sum;
        });
        
        const conditionalEntropy = calculateEntropy(conditionalProbs);
        expectedEntropy += answerProb * conditionalEntropy;
      }
    }
  }
  
  return currentEntropy - expectedEntropy;
}

/**
 * Find trait with maximum information gain using improved algorithm
 */
export function findMaxInformationGain(remainingTraits, characters, currentProbabilities, answers) {
  let maxScore = -Infinity;
  let bestTrait = null;
  
  // Calculate current entropy
  const currentEntropy = calculateEntropy(currentProbabilities);
  
  // Check if we're at start of game
  const isStartOfGame = answers.length === 0 || Object.values(currentProbabilities).every(p => 
    Math.abs(p - (1/characters.length)) < 0.01
  );
  
  for (const trait of remainingTraits) {
    let score;
    
    if (isStartOfGame) {
      // At game start, prefer high-value traits with variety
      const baseScore = (trait.infoValue || 0.5) * 10;
      const popularityBonus = (trait.popularity || 0.3) * 5;
      const randomFactor = Math.random() * 2; // Add variety
      score = baseScore + popularityBonus + randomFactor;
    } else {
      // Get possible answers for this trait
      const possibleAnswers = getPossibleAnswersSync(trait, characters);
      
      // Calculate expected information gain
      const infoGain = calculateInformationGain(
        trait, 
        characters, 
        currentProbabilities, 
        currentEntropy,
        possibleAnswers
      );
      
      // Boost based on historical information value
      const historyBoost = (trait.infoValue || 0.5) * 2;
      
      // Penalize very rare traits unless we're desperate
      const rarityPenalty = (trait.popularity || 0.1) < 0.05 ? -1 : 0;
      
      // Combine factors
      score = infoGain + historyBoost + rarityPenalty;
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestTrait = trait;
    }
  }
  //return something even if the traits have similar info gain
  return bestTrait || remainingTraits[Math.floor(Math.random() * remainingTraits.length)];

}

/**
 * Synchronous way to get getPossibleAnswers for use in main loop
 */
function getPossibleAnswersSync(trait, characters) {
  if (trait.type === 'BOOLEAN') {
    return ['TRUE', 'FALSE', 'UNKNOWN'];
  } else if (trait.type === 'ENUM') {
    const values = characters
      .flatMap(c => c.traits)
      .filter(t => t.traitId === trait.id)
      .map(t => t.value)
      .filter(v => v && v !== 'UNKNOWN');
    
    const uniqueValues = [...new Set(values)];
    return uniqueValues.length > 0 ? [...uniqueValues, 'UNKNOWN'] : ['UNKNOWN'];
  }
  return ['UNKNOWN'];
}
export async function getNextQuestion(sessionId) {
  try {
    const characters = await prisma.character.findMany({
      include: { 
        traits: { 
          include: { trait: true } 
        } 
      }
    });
    
    const answers = await prisma.answerLog.findMany({ 
      where: { sessionId } 
    });
    
    const allTraits = await prisma.trait.findMany({ 
      where: { active: true } 
    });

    const askedTraitIds = answers.map(a => a.traitId);
    const remainingTraits = allTraits.filter(t => !askedTraitIds.includes(t.id));
    
    if (remainingTraits.length === 0) return null;

    const probabilities = calculateProbabilities(characters, answers);
    const bestTrait = findMaxInformationGain(remainingTraits, characters, probabilities, answers);
    
    if (bestTrait) {
      return await formatQuestion(bestTrait);
    }
    
    return null;
  } catch (error) {
    console.error("Error in getNextQuestion:", error);
    throw error;
  }
}

/**
 * Get top N most likely characters
 */
export function getTopChoices(probabilities, characters, topN = 3) {
  return Object.entries(probabilities)
    .sort(([, probA], [, probB]) => probB - probA)
    .slice(0, topN)
    .map(([charId, prob]) => ({
      character: characters.find(c => c.id === charId),
      probability: prob
    }));
}

/**
 * stopping criteria with entropy and confidence checks
 */
export async function shouldMakeGuess(sessionId, maxQuestions = 20, confidenceThreshold = 0.65) {
  const answers = await prisma.answerLog.findMany({ 
    where: { sessionId } 
  });
  
  const characters = await prisma.character.findMany({
    include: { traits: { include: { trait: true } } }
  });
  
  const probabilities = calculateProbabilities(characters, answers);
  const maxProbability = Math.max(...Object.values(probabilities));
  const entropy = calculateEntropy(probabilities);
  
  // Always ask at least 5 questions unless extremely confident
  if (answers.length < 5) {
    return maxProbability >= 0.95;
  }
  
  // Stop if we've asked too many questions
  if (answers.length >= maxQuestions) return true;
  
  // Stop if high confidence OR very low entropy
  return maxProbability >= confidenceThreshold || entropy < 0.4;
}

/**
 * Get most likely character with enhanced metadata
 */
export async function getMostLikelyCharacter(sessionId) {
  try {
    const characters = await prisma.character.findMany({
      include: { 
        traits: { 
          include: { trait: true } 
        } 
      }
    });
    
    const answers = await prisma.answerLog.findMany({ 
      where: { sessionId } 
    });

    const probabilities = calculateProbabilities(characters, answers);
    
    let maxProb = 0;
    let bestCharacter = null;
    
    for (const [charId, prob] of Object.entries(probabilities)) {
      if (prob > maxProb) {
        maxProb = prob;
        bestCharacter = characters.find(c => c.id === charId);
      }
    }

    return {
      character: bestCharacter,
      confidence: maxProb,
      topChoices: getTopChoices(probabilities, characters, 3),
      entropy: calculateEntropy(probabilities)
    };
  } catch (error) {
    console.error("Error in getMostLikelyCharacter:", error);
    throw error;
  }
}

/**
 * Update trait statistics based on actual information value
 * Measures real entropy reduction instead of simple correctness
 */
export async function updateTraitStatistics(sessionId, correctCharacterId) {
  try {
    const answers = await prisma.answerLog.findMany({
      where: { sessionId },
      include: { trait: true },
      orderBy: { createdAt: 'asc' }
    });
    
    const characters = await prisma.character.findMany({
      include: { traits: { include: { trait: true } } }
    });
    
    // Calculate how much each question reduced entropy
    let currentProbs = {};
    characters.forEach(c => {
      currentProbs[c.id] = 1 / characters.length;
    });
    
    const maxEntropy = Math.log2(characters.length);
    
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const entropyBefore = calculateEntropy(currentProbs);
      
      // Simulate the answer's effect
      const answersUpToNow = answers.slice(0, i + 1);
      currentProbs = calculateProbabilities(characters, answersUpToNow);
      const entropyAfter = calculateEntropy(currentProbs);
      
      const entropyReduction = entropyBefore - entropyAfter;
      const normalizedReduction = maxEntropy > 0 ? entropyReduction / maxEntropy : 0;
      
      // Update trait statistics
      const trait = answer.trait;
      
      // Information value based on actual entropy reduction
      const oldInfoValue = trait.infoValue || 0.5;
      const newInfoValue = oldInfoValue * 0.9 + normalizedReduction * 0.1;
      
      // Popularity increases with each use
      const oldPopularity = trait.popularity || 0.3;
      const newPopularity = oldPopularity * 0.95 + 0.05;
      
      await prisma.trait.update({
        where: { id: answer.traitId },
        data: {
          popularity: Math.max(0.01, Math.min(1, newPopularity)),
          infoValue: Math.max(0.01, Math.min(1, newInfoValue))
        }
      });
    }
    
    // Bonus: reward traits that appeared early in successful games
    for (let i = 0; i < Math.min(5, answers.length); i++) {
      const answer = answers[i];
      const earlyBonus = (5 - i) * 0.01; // Earlier questions get bigger bonus
      
      await prisma.trait.update({
        where: { id: answer.traitId },
        data: {
          infoValue: {
            increment: earlyBonus
          }
        }
      });
    }
  } catch (error) {
    console.error("Error updating trait statistics:", error);
  }
}

/**
 * Get game quality metrics for performance monitoring
 */
export async function getGameMetrics(sessionId) {
  try {
    const answers = await prisma.answerLog.findMany({ 
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });
    
    const characters = await prisma.character.findMany({
      include: { traits: { include: { trait: true } } }
    });
    
    if (characters.length === 0) return null;
    
    // Calculate entropy reduction per question
    const entropyReductions = [];
    let currentProbs = {};
    characters.forEach(c => {
      currentProbs[c.id] = 1 / characters.length;
    });
    
    for (let i = 0; i < answers.length; i++) {
      const entropyBefore = calculateEntropy(currentProbs);
      const answersUpToNow = answers.slice(0, i + 1);
      currentProbs = calculateProbabilities(characters, answersUpToNow);
      const entropyAfter = calculateEntropy(currentProbs);
      
      entropyReductions.push(entropyBefore - entropyAfter);
    }
    
    const avgReduction = entropyReductions.length > 0 
      ? entropyReductions.reduce((a, b) => a + b, 0) / entropyReductions.length 
      : 0;
    
    return {
      totalQuestions: answers.length,
      averageEntropyReduction: avgReduction,
      finalEntropy: calculateEntropy(currentProbs),
      entropyReductions,
      efficiency: avgReduction > 0 ? (Math.log2(characters.length) / answers.length) : 0
    };
  } catch (error) {
    console.error("Error calculating game metrics:", error);
    return null;
  }
}