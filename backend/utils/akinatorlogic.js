import { prisma } from "../lib/prisma.js";

//question formatting - now pulls from questions table
export async function formatQuestion(trait) {
  try {
    // Try to get specific questions from the questions table for this trait
    const traitQuestions = await prisma.question.findMany({
      where: { 
        traitId: trait.id,
        active: true 
      }
      // Removed popularity and infoValue sorting since they don't exist in your schema
    });

    // If we have specific questions for this trait, use a random one
    if (traitQuestions.length > 0) {
      const randomQuestion = traitQuestions[Math.floor(Math.random() * traitQuestions.length)];
      return {
        id: randomQuestion.id, // Use question ID, not trait ID
        text: randomQuestion.text,
        type: trait.type, // Use trait's type since question doesn't have type
        key: trait.key,
        displayName: trait.displayName,
        popularity: trait.popularity, // Use trait's popularity
        infoValue: trait.infoValue,   // Use trait's infoValue
        traitId: trait.id // Keep reference to the underlying trait
      };
    }

    // Fallback: Use the old formatQuestion logic if no specific questions exist
    const specificQuestions = {
      // Boolean traits
      'Super Strength': 'Does your character have super strength?',
      'Flight': 'Can your character fly?',
      'Super Speed': 'Is your character super fast?',
      'Super Intelligence': 'Is your character super intelligent?',
      'Super Durability': 'Is your character super durable?',
      
      // Enum traits - convert to meaningful questions
      'alignment': 'Is your character good-aligned?',
      'gender': 'Is your character male?',
      'species': 'Is your character human?',
      'occupation': 'Does your character have a specific occupation?',
      'origin': 'Is your character from a specific origin?',
      'affiliation': 'Is your character part of a specific group?'
    };
    
    const questionText = specificQuestions[trait.key] || 
      specificQuestions[trait.displayName] || 
      `Is your character ${trait.displayName}?`;
    
    return {
      id: `temp-${trait.id}`, // Still use trait ID as fallback
      text: questionText,
      type: trait.type,
      key: trait.key,
      displayName: trait.displayName,
      popularity: trait.popularity,
      infoValue: trait.infoValue,
      traitId: trait.id
    };
  } catch (error) {
    console.error("Error formatting question:", error);
    // Fallback to basic question
    return {
      id: trait.id,
      text: `Is your character ${trait.displayName}?`,
      type: trait.type,
      key: trait.key,
      displayName: trait.displayName,
      popularity: trait.popularity,
      infoValue: trait.infoValue,
      traitId: trait.id
    };
  }
}

export async function getNextQuestion(sessionId) {
  try {
    // 1. Load all characters, traits, and session answers
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

    // 2. Get asked trait IDs (from either trait-based or question-based answers)
    const askedTraitIds = answers.map(a => a.traitId);
    
    // 3. Filter unanswered traits
    const remainingTraits = allTraits.filter(t => !askedTraitIds.includes(t.id));
    
    if (remainingTraits.length === 0) return null;

    // 4. Calculate current probabilities
    const probabilities = calculateProbabilities(characters, answers);
    
    // 5. Find trait with maximum information gain (your existing logic)
    const bestTrait = findMaxInformationGain(remainingTraits, characters, probabilities, answers);
    
    if (bestTrait) {
      // 6. Format the question - now pulls from questions table
      return await formatQuestion(bestTrait);
    }
    
    return null;
  } catch (error) {
    console.error("Error in getNextQuestion:", error);
    throw error;
  }
}

// Calculate probabilities using Naive Bayes
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
    
    // Calculate new probabilities for each character
    characters.forEach(char => {
      const charTrait = char.traits.find(t => t.traitId === traitId);
      const charValue = charTrait ? charTrait.value : 'UNKNOWN';
      
      // Get the trait to check its type
      const trait = charTrait?.trait;
      
      // Likelihood: P(answer | character)
      let likelihood;
      
      if (userAnswer === 'UNKNOWN') {
        likelihood = 0.5; // Neutral for unknown answers
      } else if (trait?.type === 'ENUM') {
        // Handle enum traits (alignment, gender, species, etc.)
        if (trait.key === 'alignment') {
          // For alignment: TRUE = Good, FALSE = Evil/Neutral
          if (userAnswer === 'TRUE') {
            likelihood = charValue === 'Good' ? 0.9 : 0.1;
          } else if (userAnswer === 'FALSE') {
            likelihood = (charValue === 'Evil' || charValue === 'Neutral') ? 0.9 : 0.1;
          } else {
            likelihood = 0.5; // Unknown answer
          }
        } else if (trait.key === 'gender') {
          // For gender: TRUE = Male, FALSE = Female
          if (userAnswer === 'TRUE') {
            likelihood = charValue === 'Male' ? 0.9 : 0.1;
          } else if (userAnswer === 'FALSE') {
            likelihood = charValue === 'Female' ? 0.9 : 0.1;
          } else {
            likelihood = 0.5;
          }
        } else {
          // Generic enum handling - direct value matching
          likelihood = charValue === userAnswer ? 0.9 : 0.1;
        }
      } else {
        // Boolean trait handling (original logic)
        if (charValue === userAnswer) {
          likelihood = 0.9; // High probability if match
        } else if (charValue === 'UNKNOWN') {
          likelihood = 0.3; // Low probability if character has unknown value
        } else {
          likelihood = 0.1; // Low probability if mismatch
        }
      }
      
      newProbabilities[char.id] = probabilities[char.id] * likelihood;
      totalWeight += newProbabilities[char.id];
    });
    
    // Normalize probabilities
    if (totalWeight > 0) {
      characters.forEach(char => {
        probabilities[char.id] = newProbabilities[char.id] / totalWeight;
      });
    }
  });
  
  return probabilities;
}
// Find trait with maximum information gain
export function findMaxInformationGain(remainingTraits, characters, currentProbabilities, answers) {
  let maxInfoGain = -1;
  let bestTrait = null;
  
  // Calculate current entropy
  const currentEntropy = calculateEntropy(currentProbabilities);
  
  // If all probabilities are equal (start of game), use popularity-based selection
  const isStartOfGame = Object.values(currentProbabilities).every(p => 
    Math.abs(p - (1/characters.length)) < 0.01
  );
  
  for (const trait of remainingTraits) {
    let infoGain;
    
    if (isStartOfGame) {
      // At game start, use popularity + random factor to vary questions
      const randomFactor = 0.1 + Math.random() * 0.3; // Add some randomness
      infoGain = (trait.popularity || 0.1) * randomFactor;
    } else {
      // Normal information gain calculation
      infoGain = calculateInformationGain(trait, characters, currentProbabilities, currentEntropy);
      
      // Boost info gain for traits that haven't been asked much
      const popularityBoost = 1 - (trait.popularity || 0);
      infoGain *= (1 + popularityBoost * 0.5); // Boost by up to 50%
    }
    
    if (infoGain > maxInfoGain) {
      maxInfoGain = infoGain;
      bestTrait = trait;
    }
  }
  
  return bestTrait;
}

// Calculate entropy of current probability distribution
export function calculateEntropy(probabilities) {
  let entropy = 0;
  for (const prob of Object.values(probabilities)) {
    if (prob > 0) {
      entropy -= prob * Math.log2(prob);
    }
  }
  return entropy;
}

// Calculate information gain for a specific trait
export  function calculateInformationGain(trait, characters, currentProbabilities, currentEntropy) {
  const answers = ['TRUE', 'FALSE', 'UNKNOWN'];
  let weightedEntropy = 0;
  
  answers.forEach(answer => {
    // Calculate probability of getting this answer
    let answerProb = 0;
    characters.forEach(char => {
      const charTrait = char.traits.find(t => t.traitId === trait.id);
      const charValue = charTrait ? charTrait.value : 'UNKNOWN';
      
      if (charValue === answer) {
        answerProb += currentProbabilities[char.id];
      } else if (answer === 'UNKNOWN') {
        // Small probability for unknown answers
        answerProb += currentProbabilities[char.id] * 0.1;
      }
    });
    
    if (answerProb > 0) {
      // Calculate conditional probabilities for this answer
      const conditionalProbs = {};
      let sum = 0;
      
      characters.forEach(char => {
        const charTrait = char.traits.find(t => t.traitId === trait.id);
        const charValue = charTrait ? charTrait.value : 'UNKNOWN';
        
        if (charValue === answer) {
          conditionalProbs[char.id] = currentProbabilities[char.id];
        } else {
          conditionalProbs[char.id] = 0;
        }
        sum += conditionalProbs[char.id];
      });
      
      // Normalize
      if (sum > 0) {
        Object.keys(conditionalProbs).forEach(charId => {
          conditionalProbs[charId] /= sum;
        });
        
        const conditionalEntropy = calculateEntropy(conditionalProbs);
        weightedEntropy += answerProb * conditionalEntropy;
      }
    }
  });
  
  return currentEntropy - weightedEntropy;
}

// Get top N most likely characters
export function getTopChoices(probabilities, characters, topN = 3) {
  return Object.entries(probabilities)
    .sort(([, probA], [, probB]) => probB - probA)
    .slice(0, topN)
    .map(([charId, prob]) => ({
      character: characters.find(c => c.id === charId),
      probability: prob
    }));
}

// Check if we should stop asking questions and make a guess
export async function shouldMakeGuess(sessionId, maxQuestions = 20, confidenceThreshold = 0.8) {
  const answers = await prisma.answerLog.findMany({ 
    where: { sessionId } 
  });
  
  // Stop if we've asked too many questions
  if (answers.length >= maxQuestions) return true;
  
  // Stop if we have high confidence
  const characters = await prisma.character.findMany({
    include: { traits: { include: { trait: true } } }
  });
  
  const probabilities = calculateProbabilities(characters, answers);
  const maxProbability = Math.max(...Object.values(probabilities));
  
  return maxProbability >= confidenceThreshold;
}

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
    
    // Find character with highest probability
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
      topChoices: getTopChoices(probabilities, characters, 3)
    };
  } catch (error) {
    console.error("Error in getMostLikelyCharacter:", error);
    throw error;
  }
}
export async function updateTraitStatistics(sessionId, correctCharacterId) {
  try {
    const answers = await prisma.answerLog.findMany({
      where: { sessionId },
      include: { trait: true }
    });
    
    const correctCharacter = await prisma.character.findUnique({
      where: { id: correctCharacterId },
      include: { traits: { include: { trait: true } } }
    });
    
    // Update each trait that was asked in this session
    for (const answer of answers) {
      const characterTrait = correctCharacter.traits.find(t => 
        t.traitId === answer.traitId
      );
      
      const wasAnswerCorrect = characterTrait && 
        ((answer.answer === 'TRUE' && characterTrait.value === 'TRUE') ||
         (answer.answer === 'FALSE' && characterTrait.value === 'FALSE') ||
         (answer.answer === 'PROBABLY' && characterTrait.value === 'TRUE') ||
         (answer.answer === 'PROBABLY_NOT' && characterTrait.value === 'FALSE'));
      
      // Update trait popularity (how often this trait is useful)
      const newPopularity = (answer.trait.popularity || 0) * 0.95 + 0.05;
      
      // Update trait infoValue (how well this trait distinguishes characters)
      let newInfoValue = answer.trait.infoValue || 0;
      if (wasAnswerCorrect) {
        newInfoValue = newInfoValue * 0.9 + 0.1; // Increase if useful
      } else {
        newInfoValue = newInfoValue * 0.95; // Decrease if not useful
      }
      
      await prisma.trait.update({
        where: { id: answer.traitId },
        data: {
          popularity: newPopularity,
          infoValue: newInfoValue
        }
      });
    }
  } catch (error) {
    console.error("Error updating trait statistics:", error);
  }
}