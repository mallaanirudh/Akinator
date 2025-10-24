import { prisma } from "../lib/prisma.js";
import {getNextQuestion,  shouldMakeGuess ,updateTraitStatistics,getMostLikelyCharacter,calculateProbabilities} from "../utils/akinatorlogic.js";
// Answer a question
export const submitAnswer = async (req, res) => {
  try {
    const { sessionId, questionId, answer } = req.body;
    console.log('Submit Answer Request:', { sessionId, questionId, answer });

    // Validate input
    if (!sessionId || !questionId || !answer) {
      return res.status(400).json({ 
        error: "Missing required fields"
      });
    }

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.completed) {
      return res.status(400).json({ error: "Session completed" });
    }

    let finalTraitId;
    let finalQuestionId = null;

    // Handle two types of question IDs:
    // 1. "temp-{traitId}" - Fallback questions from formatQuestion
    // 2. Regular question IDs from the questions table
    if (questionId.startsWith('temp-')) {
      // This is a fallback question - extract the trait ID
      finalTraitId = questionId.replace('temp-', '');
      console.log('Fallback question - Trait ID:', finalTraitId);
    } else {
      // This is a regular question from the database
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { trait: true }
      });

      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      finalTraitId = question.traitId;
      finalQuestionId = questionId; // Store the actual question ID
      console.log('Database question - Trait ID:', finalTraitId, 'Question ID:', finalQuestionId);
    }

    // Verify the trait exists
    const trait = await prisma.trait.findUnique({
      where: { id: finalTraitId }
    });

    if (!trait) {
      return res.status(404).json({ error: "Trait not found" });
    }

    // Check if this trait was already answered (prevent duplicate trait questions)
    const existingAnswer = await prisma.answerLog.findFirst({
      where: { 
        sessionId, 
        traitId: finalTraitId 
      }
    });

    if (existingAnswer) {
      return res.status(400).json({ error: "This trait was already answered" });
    }

    // Store answer with both traitId and questionId (if available)
    await prisma.answerLog.create({
      data: { 
        sessionId, 
        traitId: finalTraitId,
        questionId: finalQuestionId, // Will be null for fallback questions
        answer: answer.toUpperCase()
      }
    });

    console.log('✅ Answer stored successfully');

    // Get next question and return response
    const nextQuestion = await getNextQuestion(sessionId);
    
    // Get current probabilities
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
    
    const topChoices = Object.entries(probabilities)
      .sort(([, probA], [, probB]) => probB - probA)
      .slice(0, 3)
      .map(([charId, prob]) => ({
        character: characters.find(c => c.id === charId),
        probability: prob
      }));

    // Check if we should make a guess
    const shouldGuess = await shouldMakeGuess(sessionId);
    
    if (shouldGuess) {
      const guess = await getMostLikelyCharacter(sessionId);
      return res.json({ 
        action: "guess",
        guess,
        answersCount: answers.length,
        message: "AI is ready to make a guess"
      });
    }

    if (!nextQuestion) {
      const guess = await getMostLikelyCharacter(sessionId);
      return res.json({ 
        action: "guess",
        guess,
        answersCount: answers.length,
        message: "No more questions available"
      });
    }

    res.json({ 
      action: "question",
      question: nextQuestion,
      topChoices,
      answersCount: answers.length,
      currentConfidence: topChoices[0]?.probability || 0,
      message: "Answer recorded successfully"
    });

  } catch (error) {
    console.error("Submit answer error:", error);
    res.status(500).json({ 
      error: "Failed to process answer",
      details: error.message 
    });
  }
};
// Update getSession to include questions
export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: {
            trait: true,
            question: true // Include question relation
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ session });
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
};

// Keep other functions the same...
export const startGame = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@akinator.com`,
          name: `User ${userId}`
        }
      });
    }

    const session = await prisma.session.create({ 
      data: { userId } 
    });

    const question = await getNextQuestion(session.id);
    
    res.json({ 
      sessionId: session.id, 
      question 
    });
  } catch (error) {
    console.error("Start game error:", error);
    res.status(500).json({ error: "Failed to start game session" });
  }
};

export const endGame = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: { completed: true }
    });

    res.json({ 
      message: "Game session ended",
      session 
    });
  } catch (error) {
    console.error("End game error:", error);
    res.status(500).json({ error: "Failed to end game session" });
  }
};

export const correctGuess = async (req, res) => {
  try {
    const { sessionId, correctCharacterId } = req.body;
    
    // Update trait statistics
    await updateTraitStatistics(sessionId, correctCharacterId);
    
    // End the session
    await prisma.session.update({
      where: { id: sessionId },
      data: { completed: true }
    });
    
    res.json({ 
      message: "Correction recorded and AI updated",
      learned: true 
    });
  } catch (error) {
    console.error("Correction error:", error);
    res.status(500).json({ error: "Failed to process correction" });
  }
};
// In your gameController.js
export const getGameState = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: {
            trait: true,
            question: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Get current probabilities for top choices
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
    const topChoices = Object.entries(probabilities)
      .sort(([, probA], [, probB]) => probB - probA)
      .slice(0, 3)
      .map(([charId, prob]) => ({
        character: characters.find(c => c.id === charId),
        probability: prob
      }));

    // Get current question or guess
    const shouldGuess = await shouldMakeGuess(sessionId);
    
    if (shouldGuess) {
      const guess = await getMostLikelyCharacter(sessionId);
      return res.json({
        action: "guess",
        guess,
        topChoices,
        answersCount: session.answers.length,
        currentConfidence: guess?.confidence || topChoices[0]?.probability || 0,
        message: "Ready to guess"
      });
    } else {
      const question = await getNextQuestion(sessionId);
      return res.json({
        action: "question", 
        question,
        topChoices,
        answersCount: session.answers.length,
        currentConfidence: topChoices[0]?.probability || 0,
        message: "Next question ready"
      });
    }

  } catch (error) {
    console.error("Get game state error:", error);
    res.status(500).json({ error: "Failed to get game state" });
  }
};