import {prisma} from "../lib/prisma.js";
import { getNextQuestion, getMostLikelyCharacter ,shouldMakeGuess,updateTraitStatistics } from "../utils/akinatorlogic.js";


// Start a new game session
export const startGame = async (req, res) => {
  try {
    const { userId } = req.body;
    
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

// Answer a question
export const submitAnswer = async (req, res) => {
  try {
    const { sessionId, traitId, answer } = req.body;

    // Validate input
    if (!sessionId || !traitId || !answer) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Store answer
    await prisma.answerLog.create({
      data: { sessionId, traitId, answer }
    });

    // Check if we should make a guess
    const shouldGuess = await shouldMakeGuess(sessionId);
    
    if (shouldGuess) {
      const guess = await getMostLikelyCharacter(sessionId);
      return res.json({ 
        action: "guess",
        guess 
      });
    }

    // Get next question
    const question = await getNextQuestion(sessionId);
    
    if (!question) {
      // No more questions → make guess
      const guess = await getMostLikelyCharacter(sessionId);
      return res.json({ 
        action: "guess",
        guess 
      });
    }

    res.json({ 
      action: "question",
      question 
    });
  } catch (error) {
    console.error("Submit answer error:", error);
    res.status(500).json({ error: "Failed to process answer" });
  }
};

// Get game session details
export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: {
            trait: true
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

// End game session
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
// Update trait popularity and information value after each game
