import express from "express";
import { 
  startGame, 
  submitAnswer, 
  getSession, 
  endGame,
  correctGuess,
} from "../controllers/gameController.js";

const router = express.Router();

// POST /api/game/start - Start new game session
router.post("/start", startGame);
// In gameRoutes.js
router.post("/correct", correctGuess);
// POST /api/game/answer - Submit answer to current question
router.post("/answer", submitAnswer);

// GET /api/game/session/:sessionId - Get session details
router.get("/session/:sessionId", getSession);

// POST /api/game/end - End game session
router.post("/end", endGame);

export default router;