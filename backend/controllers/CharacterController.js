import { prisma } from "../lib/prisma.js";
import { normalizeFeature } from "../utils/normalize.js";
export const addCharacter = async (req, res) => {
  try {
    const { name, universe, traits, createdBy, aliases = [] } = req.body;
    if (!name || !createdBy) {
      return res.status(400).json({ 
        error: "Name and createdBy are required" 
      });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: createdBy }
    });
    
    if (!userExists) {
      return res.status(400).json({ 
        error: "Invalid user ID. User does not exist." 
      });
    }
    // Check if character already exists
    const existing = await prisma.character.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ error: "Character already exists" });
    }

    // Create character
    const character = await prisma.character.create({
      data: { 
        name, 
        universe, 
        createdById: createdBy,
        aliases: aliases
      }
    });

    // Process each trait - users can define any trait they want
    for (let traitData of traits) {
      const { key, value, displayName, type = "STRING" } = traitData;
      
      const normalizedKey = normalizeFeature(key);
      
      // Find or create trait - ANY trait can be created dynamically
      let trait = await prisma.trait.findUnique({ 
        where: { key: normalizedKey } 
      });
      
      if (!trait) {
        // Create new trait if it doesn't exist
        trait = await prisma.trait.create({
          data: { 
            key: normalizedKey, 
            displayName: displayName || key,
            type: type.toUpperCase(), // Convert to uppercase for enum
            createdById: createdBy,
            active: true
          }
        });
        console.log(`✅ Created new trait: ${displayName || key}`);
      }

      // Convert value based on trait type
      let storedValue;
      switch (trait.type) {
        case "BOOLEAN":
          storedValue = String(value).toLowerCase() === 'true' ? 'TRUE' : 'FALSE';
          break;
        case "ENUM":
        case "STRING":
        default:
          storedValue = String(value);
          break;
      }

      // Create character trait relationship
      await prisma.characterTrait.create({
        data: { 
          characterId: character.id, 
          traitId: trait.id, 
          value: storedValue
        }
      });
    }

    // Return the complete character with traits
    const characterWithTraits = await prisma.character.findUnique({
      where: { id: character.id },
      include: {
        traits: {
          include: {
            trait: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({ 
      message: "Character added successfully", 
      character: characterWithTraits 
    });
    
  } catch (err) {
    console.error("Add character error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
};

// Get all available traits
export const getTraits = async (req, res) => {
  try {
    const traits = await prisma.trait.findMany({
      where: { active: true },
      orderBy: { displayName: 'asc' }
    });
    res.json(traits);
  } catch (err) {
    console.error("Get traits error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new trait
export const createTrait = async (req, res) => {
  try {
    const { key, displayName, type = "STRING", createdBy } = req.body;
    
    const normalizedKey = normalizeFeature(key);
    
    const trait = await prisma.trait.create({
      data: {
        key: normalizedKey,
        displayName,
        type: type.toUpperCase(),
        createdById: createdBy,
        active: true
      }
    });

    res.json({ 
      message: "Trait created successfully", 
      trait 
    });
  } catch (err) {
    console.error("Create trait error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
};
export const getCharacterById = async (req, res) => {
  try {
    const { id } = req.params;
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        traits: {
          include: {
            trait: true
          }
        }
      }
    });
    
    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }
    
    res.json(character);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
export const getCharacters = async (req, res) => {
  try {
    const characters = await prisma.character.findMany({
      include: {
        traits: {
          include: {
            trait: true
          }
        }
      }
    });
    res.json(characters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
export const addTraitToCharacter = async (req, res) => {
  try {
    const { characterId } = req.params; // Get from URL params
    const { traitKey, value } = req.body;
    
    // Find the trait
    const trait = await prisma.trait.findUnique({
      where: { key: traitKey }
    });
    
    if (!trait) {
      return res.status(404).json({ error: "Trait not found" });
    }
    
    // Create character trait relationship
    const characterTrait = await prisma.characterTrait.create({
      data: {
        characterId,
        traitId: trait.id,
        value: value
      }
    });
    
    res.json({ 
      message: "Trait added to character successfully",
      characterTrait 
    });
  } catch (error) {
    console.error("Add trait to character error:", error);
    res.status(500).json({ error: "Failed to add trait to character" });
  }
};