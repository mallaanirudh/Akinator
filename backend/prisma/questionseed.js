// seedQuestions.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedQuestions() {
  try {
    console.log('Starting to seed questions...');

    // Get all traits first
    const traits = await prisma.trait.findMany();
    console.log(`Found ${traits.length} traits`);

    // Get a user to use as createdById (use the first user or create one if none exists)
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'admin@superheroes.com',
          name: 'Superhero Admin'
        }
      });
      console.log('Created default user for questions');
    }

    const questions = [
      // AFFILIATION QUESTIONS
      { traitKey: 'affiliation', text: 'Is your character an Avenger?' },
      { traitKey: 'affiliation', text: 'Is your character in the Justice League?' },
      { traitKey: 'affiliation', text: 'Is your character an X-Man?' },
      { traitKey: 'affiliation', text: 'Is your character a Guardian of the Galaxy?' },
      { traitKey: 'affiliation', text: 'Is your character in the Fantastic Four?' },
      { traitKey: 'affiliation', text: 'Is your character in the Suicide Squad?' },
      { traitKey: 'affiliation', text: 'Is your character part of X-Force?' },
      { traitKey: 'affiliation', text: 'Is your character a Teen Titan?' },
      { traitKey: 'affiliation', text: 'Is your character in the Injustice League?' },
      
      // GENDER QUESTIONS
      { traitKey: 'gender', text: 'Is your character male?' },
      { traitKey: 'gender', text: 'Is your character female?' },
      
      // ALIGNMENT QUESTIONS
      { traitKey: 'alignment', text: 'Is your character good-aligned?' },
      { traitKey: 'alignment', text: 'Is your character evil?' },
      { traitKey: 'alignment', text: 'Is your character neutral?' },
      
      // SPECIES QUESTIONS
      { traitKey: 'species', text: 'Is your character human?' },
      { traitKey: 'species', text: 'Is your character a mutant?' },
      { traitKey: 'species', text: 'Is your character an alien?' },
      { traitKey: 'species', text: 'Is your character an Amazonian?' },
      { traitKey: 'species', text: 'Is your character from Asgard?' },
      { traitKey: 'species', text: 'Is your character an Atlantean?' },
      { traitKey: 'species', text: 'Is your character a Kryptonian?' },
      
      // SUPER STRENGTH QUESTIONS
      { traitKey: 'Super Strength', text: 'Does your character have super strength?' },
      { traitKey: 'Super Strength', text: 'Is your character incredibly strong?' },
      { traitKey: 'Super Strength', text: 'Can your character lift heavy objects like cars?' },
      
      // FLIGHT QUESTIONS
      { traitKey: 'Flight', text: 'Can your character fly?' },
      { traitKey: 'Flight', text: 'Does your character have the ability of flight?' },
      { traitKey: 'Flight', text: 'Can your character soar through the air?' },
      
      // SUPER SPEED QUESTIONS
      { traitKey: 'Super Speed', text: 'Is your character super fast?' },
      { traitKey: 'Super Speed', text: 'Can your character move at incredible speeds?' },
      { traitKey: 'Super Speed', text: 'Is your character faster than a speeding bullet?' },
      
      // SUPER INTELLIGENCE QUESTIONS
      { traitKey: 'Super Intelligence', text: 'Is your character super intelligent?' },
      { traitKey: 'Super Intelligence', text: 'Is your character a genius?' },
      { traitKey: 'Super Intelligence', text: 'Is your character highly intelligent?' },
      
      // SUPER DURABILITY QUESTIONS
      { traitKey: 'Super Durability', text: 'Is your character super durable?' },
      { traitKey: 'Super Durability', text: 'Is your character nearly invulnerable?' },
      { traitKey: 'Super Durability', text: 'Can your character withstand extreme damage?' },
      
      // OCCUPATION QUESTIONS
      { traitKey: 'occupation', text: 'Is your character a vigilante?' },
      { traitKey: 'occupation', text: 'Is your character a scientist?' },
      { traitKey: 'occupation', text: 'Is your character royalty?' },
      { traitKey: 'occupation', text: 'Is your character a soldier?' },
      { traitKey: 'occupation', text: 'Is your character an assassin?' },
      { traitKey: 'occupation', text: 'Is your character a journalist?' },
      { traitKey: 'occupation', text: 'Is your character a billionaire?' },
      { traitKey: 'occupation', text: 'Is your character a photographer?' },
      
      // ORIGIN QUESTIONS
      { traitKey: 'origin', text: 'Is your character from Earth?' },
      { traitKey: 'origin', text: 'Is your character from another planet?' },
      { traitKey: 'origin', text: 'Is your character from New York City?' },
      { traitKey: 'origin', text: 'Is your character from Gotham City?' },
      { traitKey: 'origin', text: 'Is your character from a mythical place?' },
      { traitKey: 'origin', text: 'Is your character from an underwater kingdom?' }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const qData of questions) {
      const trait = traits.find(t => t.key === qData.traitKey);
      
      if (!trait) {
        console.log(`Trait not found for key: ${qData.traitKey}`);
        skippedCount++;
        continue;
      }

      try {
        // Check if question already exists
        const existingQuestion = await prisma.question.findFirst({
          where: {
            traitId: trait.id,
            text: qData.text
          }
        });

        if (existingQuestion) {
          console.log(`- Skipped duplicate: "${qData.text}"`);
          skippedCount++;
          continue;
        }

        // Create new question - only with the fields that exist in your schema
        await prisma.question.create({
          data: {
            traitId: trait.id,
            text: qData.text,
            createdById: user.id,
            active: true
          }
        });
        createdCount++;
        console.log(`✓ Created question: "${qData.text}"`);
      } catch (error) {
        console.error(`Error creating question "${qData.text}":`, error);
        skippedCount++;
      }
    }

    console.log('\n🎉 Seeding completed!');
    console.log(`✅ Created: ${createdCount} questions`);
    console.log(`⏭️  Skipped: ${skippedCount} questions`);
    console.log(`📊 Total questions in database: ${createdCount}`);

  } catch (error) {
    console.error('Error seeding questions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedQuestions()
  .catch((e) => {
    console.error('Seeder failed:', e);
    process.exit(1);
  });