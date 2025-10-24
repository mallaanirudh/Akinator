import { prisma } from "../lib/prisma.js";
async function getTraitPossibleValues(traitId) {
  try {
    const trait = await prisma.trait.findUnique({
      where: { id: traitId },
      include: {
        characterTraits: {
          select: {
            value: true
          },
          distinct: ['value']
        }
      }
    });

    if (!trait) {
      return ['UNKNOWN'];
    }

    // For BOOLEAN traits, return standard boolean options
    if (trait.type === 'BOOLEAN') {
      return ['YES', 'NO', 'PROBABLY', 'PROBABLY_NOT', 'UNKNOWN'];
    }

    // For ENUM traits, get unique values from character traits
    if (trait.type === 'ENUM' && trait.characterTraits.length > 0) {
      const values = trait.characterTraits
        .map(ct => ct.value)
        .filter(value => value && value !== 'UNKNOWN')
        .slice(0, 8); // Limit to 8 options for usability
      
      if (values.length > 0) {
        return [...values, 'UNKNOWN'];
      }
    }

    // Fallback for STRING traits or no data
    return ['YES', 'NO', 'UNKNOWN'];
    
  } catch (error) {
    console.error('Error getting trait possible values:', error);
    return ['YES', 'NO', 'UNKNOWN'];
  }
}
function normalizeUserAnswer(answer) {
  if (!answer) return 'UNKNOWN';
  
  const mapping = {
    'YES': 'TRUE', 'Y': 'TRUE', 'TRUE': 'TRUE', '1': 'TRUE',
    'NO': 'FALSE', 'N': 'FALSE', 'FALSE': 'FALSE', '0': 'FALSE',
    'SOMETIMES': 'PROBABLY_YES', 'MAYBE': 'PROBABLY_YES',
    'PROBABLY': 'PROBABLY_YES', 'LIKELY': 'PROBABLY_YES',
    'PROBABLY_NOT': 'PROBABLY_NO', 'UNLIKELY': 'PROBABLY_NO',
    'UNKNOWN': 'UNKNOWN', 'IDK': 'UNKNOWN', 'DONT_KNOW': 'UNKNOWN',
    'DON\'T_KNOW': 'UNKNOWN'
  };
  
  const normalized = answer.toUpperCase().trim();
  return mapping[normalized] || 'UNKNOWN';
}
function getPossibleAnswers(trait, characters) {
  if (trait.type === 'BOOLEAN') {
    return ['YES', 'NO', 'PROBABLY', 'PROBABLY_NOT', 'UNKNOWN'];
  } else if (trait.type === 'ENUM') {
    // Use Set for faster lookups
    const valueSet = new Set();
    characters.forEach(char => {
      const charTrait = char.traits.find(t => t.traitId === trait.id);
      if (charTrait && charTrait.value && charTrait.value !== 'UNKNOWN') {
        valueSet.add(charTrait.value);
      }
    });
    return valueSet.size > 0 ? [...valueSet, 'UNKNOWN'] : ['UNKNOWN'];
  }
  return ['YES', 'NO', 'UNKNOWN'];
}
function getPossibleAnswersSync(trait, characters) {
  return getPossibleAnswers(trait, characters);
}
function getValueFrequency(traitId, value, characters) {
  const total = characters.length;
  if (total === 0) return 0.5;
  
  let matches = 0;
  for (const char of characters) {
    if (char.traits.some(t => t.traitId === traitId && t.value === value)) {
      matches++;
    }
  }
  
  // Laplace smoothing
  return (matches + 1) / (total + 2);
}



/**
 * Improved likelihood calculation with better probability modeling
 */
function calculateLikelihood(userAnswer, charValue, trait, characters = []) {
  const normalizedAnswer = normalizeUserAnswer(userAnswer);
  const normalizedCharValue = charValue?.toUpperCase()?.trim() || 'UNKNOWN';

  // Handle unknown cases first
  if (normalizedAnswer === 'UNKNOWN') return 0.5;
  if (normalizedCharValue === 'UNKNOWN') return 0.3;

  let likelihood = 0.5;

  if (trait?.type === 'ENUM') {
    const freq = getValueFrequency(trait.id, normalizedCharValue, characters);
    
    if (normalizedCharValue === normalizedAnswer) {
      // Character matches - higher confidence for rare traits
      likelihood = 0.7 + (0.25 * (1 - freq));
    } else {
      // Character doesn't match - lower penalty for common traits
      likelihood = 0.3 * freq;
    }
  }
  else if (trait?.type === 'BOOLEAN') {
    const isTrue = normalizedCharValue === 'TRUE';
    
    switch (normalizedAnswer) {
      case 'TRUE': 
        likelihood = isTrue ? 0.85 : 0.15; 
        break;
      case 'FALSE': 
        likelihood = isTrue ? 0.15 : 0.85; 
        break;
      case 'PROBABLY_YES': 
        likelihood = isTrue ? 0.70 : 0.30; 
        break;
      case 'PROBABLY_NO': 
        likelihood = isTrue ? 0.30 : 0.70; 
        break;
      default: 
        likelihood = 0.5;
    }
  }

  // Ensure likelihood stays within reasonable bounds
  return Math.max(0.05, Math.min(0.95, likelihood));
}

// ==================== OPTIMIZED PROBABILITY CALCULATIONS ====================

/**
 * Fast probability calculation with early termination
 */
export function calculateProbabilities(characters, answers) {
  const totalCharacters = characters.length;
  if (totalCharacters === 0) return {};
  
  const probabilities = {};
  const initialProb = 1 / totalCharacters;
  
  // Initialize with small random variations to break ties
  characters.forEach(char => {
    probabilities[char.id] = initialProb * (0.95 + Math.random() * 0.1);
  });

  // Process answers in batches for better performance
  for (const answer of answers) {
    const traitId = answer.traitId;
    const userAnswer = answer.answer;
    
    let totalWeight = 0;
    const newProbabilities = {};
    
    for (const char of characters) {
      const charTrait = char.traits.find(t => t.traitId === traitId);
      const charValue = charTrait ? charTrait.value : 'UNKNOWN';
      const trait = charTrait?.trait;
      
      const likelihood = calculateLikelihood(userAnswer, charValue, trait, characters);
      newProbabilities[char.id] = probabilities[char.id] * likelihood;
      totalWeight += newProbabilities[char.id];
    }
    
    // Normalize with numerical stability
    const EPS = 1e-8;
    if (totalWeight > EPS) {
      for (const char of characters) {
        probabilities[char.id] = (newProbabilities[char.id] + EPS) / (totalWeight + EPS * totalCharacters);
      }
    }
  }
  
  return probabilities;
}

/**
 * Efficient entropy calculation
 */
export function calculateEntropy(probabilities) {
  let entropy = 0;
  for (const prob of Object.values(probabilities)) {
    if (prob > 1e-10 && prob < 1 - 1e-10) {
      entropy -= prob * Math.log2(prob);
    }
  }
  return entropy;
}

// ==================== IMPROVED QUESTION SELECTION ====================

/**
 * Enhanced information gain calculation
 */
export function calculateInformationGain(trait, characters, currentProbabilities, currentEntropy, possibleAnswers) {
  let expectedEntropy = 0;
  let totalAnswerProb = 0;
  
  for (const answer of possibleAnswers) {
    let answerProb = 0;
    const conditionalProbs = {};
    
    for (const char of characters) {
      const charTrait = char.traits.find(t => t.traitId === trait.id);
      const charValue = charTrait ? charTrait.value : 'UNKNOWN';
      const likelihood = calculateLikelihood(answer, charValue, trait, characters);
      
      const contribution = currentProbabilities[char.id] * likelihood;
      answerProb += contribution;
      conditionalProbs[char.id] = contribution;
    }
    
    // Only consider answers with meaningful probability
    if (answerProb > 0.001) {
      totalAnswerProb += answerProb;
      
      // Normalize and calculate conditional entropy
      let conditionalEntropy = 0;
      for (const charId in conditionalProbs) {
        const prob = conditionalProbs[charId] / answerProb;
        if (prob > 1e-10 && prob < 1 - 1e-10) {
          conditionalEntropy -= prob * Math.log2(prob);
        }
      }
      
      expectedEntropy += answerProb * conditionalEntropy;
    }
  }
  
  // Handle cases where not all probability is accounted for
  if (totalAnswerProb < 0.99) {
    expectedEntropy += (1 - totalAnswerProb) * currentEntropy;
  }
  
  return Math.max(0, currentEntropy - expectedEntropy);
}

/**
 * Smart trait selection with game stage awareness
 */
export function findMaxInformationGain(remainingTraits, characters, currentProbabilities, answers) {
  if (remainingTraits.length === 0) return null;
  
  const currentEntropy = calculateEntropy(currentProbabilities);
  const isStartOfGame = answers.length < 3;
  const isMidGame = answers.length >= 3 && answers.length < 10;
  
  let maxScore = -Infinity;
  let bestTrait = null;
  
  for (const trait of remainingTraits) {
    let score;
    
    if (isStartOfGame) {
      // Early game: prioritize popular, high-value traits
      const baseValue = (trait.infoValue || 0.5) * 12;
      const popularity = (trait.popularity || 0.3) * 8;
      const diversity = Math.random() * 3; // Encourage variety
      score = baseValue + popularity + diversity;
    } else {
      // Calculate actual information gain
      const possibleAnswers = getPossibleAnswersSync(trait, characters);
      const infoGain = calculateInformationGain(
        trait, characters, currentProbabilities, currentEntropy, possibleAnswers
      );
      
      // Strategic adjustments
      const valueBonus = (trait.infoValue || 0.5) * (isMidGame ? 1.5 : 1.0);
      const rarityAdjustment = (trait.popularity || 0.1) < 0.03 ? -2 : 0;
      
      score = infoGain + valueBonus + rarityAdjustment;
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestTrait = trait;
    }
  }
  
  return bestTrait || remainingTraits[Math.floor(Math.random() * remainingTraits.length)];
}

// ==================== OPTIMIZED CORE FUNCTIONS ====================

/**
 * Fast next question selection with error handling
 */
export async function getNextQuestion(sessionId) {
  try {
    // Batch database queries for better performance
    const [characters, answers, allTraits] = await Promise.all([
      prisma.character.findMany({
        include: { 
          traits: { 
            include: { trait: true } 
          } 
        }
      }),
      prisma.answerLog.findMany({ 
        where: { sessionId } 
      }),
      prisma.trait.findMany({ 
        where: { active: true } 
      })
    ]);

    if (characters.length === 0) {
      throw new Error("No characters available");
    }

    const askedTraitIds = new Set(answers.map(a => a.traitId));
    const remainingTraits = allTraits.filter(t => !askedTraitIds.has(t.id));
    
    if (remainingTraits.length === 0) return null;

    const probabilities = calculateProbabilities(characters, answers);
    const bestTrait = findMaxInformationGain(remainingTraits, characters, probabilities, answers);
    
    return bestTrait ? await formatQuestion(bestTrait) : null;
    
  } catch (error) {
    console.error("Error in getNextQuestion:", error);
    throw error;
  }
}

/**
 * Improved stopping criteria
 */
export async function shouldMakeGuess(sessionId, maxQuestions = 20, confidenceThreshold = 0.75) {
  const [answers, characters] = await Promise.all([
    prisma.answerLog.findMany({ where: { sessionId } }),
    prisma.character.findMany({
      include: { traits: { include: { trait: true } } }
    })
  ]);
  
  if (characters.length === 0) return true;
  
  const probabilities = calculateProbabilities(characters, answers);
  const maxProbability = Math.max(...Object.values(probabilities));
  const entropy = calculateEntropy(probabilities);
  
  // Multi-factor stopping decision
  if (answers.length >= maxQuestions) return true;
  if (maxProbability >= confidenceThreshold) return true;
  if (entropy < 0.2 && answers.length >= 8) return true;
  if (maxProbability > 0.9 && answers.length >= 5) return true;
  
  return false;
}

/**
 * Efficient top choices calculation
 */
export function getTopChoices(probabilities, characters, topN = 3) {
  return Object.entries(probabilities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([id, prob]) => ({
      character: characters.find(c => c.id === id),
      probability: prob,
      confidence: prob > 0.8 ? 'HIGH' : prob > 0.6 ? 'MEDIUM' : 'LOW'
    }));
}

/**
 * Fast most likely character with confidence scoring
 */
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

// ==================== PERFORMANCE OPTIMIZATIONS ====================

/**
 * Batch update trait statistics
 */
export async function updateTraitStatistics(sessionId, correctCharacterId) {
  try {
    const [answers, characters] = await Promise.all([
      prisma.answerLog.findMany({
        where: { sessionId },
        include: { trait: true },
        orderBy: { createdAt: 'asc' }
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

/**
 * Quick game metrics
 */
export async function getGameMetrics(sessionId) {
  try {
    const [answers, characters] = await Promise.all([
      prisma.answerLog.findMany({ 
        where: { sessionId },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.character.findMany({
        include: { traits: { include: { trait: true } } }
      })
    ]);
    
    if (characters.length === 0) return null;
    
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
  } catch (error) {
    console.error("Error calculating game metrics:", error);
    return null;
  }
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