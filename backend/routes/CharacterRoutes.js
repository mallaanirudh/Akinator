import express from "express";
import { 
  addCharacter, 
  getCharacters, 
  getCharacterById,
  getTraits,
  createTrait,
  addTraitToCharacter
} from "../controllers/CharacterController.js";

const router = express.Router();

// Character routes
router.post("/add", addCharacter);
router.get("/", getCharacters);
router.get("/:id", getCharacterById);

// Trait management routes
router.get("/traits/all", getTraits);
router.post("/traits/create", createTrait);
router.post("/:characterId/add-trait", addTraitToCharacter);

export default router;