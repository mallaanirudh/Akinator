import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateTraits() {
  try {
    console.log('🔄 Updating trait statistics...');
    
    const traits = await prisma.trait.findMany();
    console.log(`📊 Found ${traits.length} traits to update`);
    
    for (const trait of traits) {
      const newPopularity = 0.3 + Math.random() * 0.4; // 0.3-0.7
      const newInfoValue = 0.2 + Math.random() * 0.3;  // 0.2-0.5
      
      await prisma.trait.update({
        where: { id: trait.id },
        data: {
          popularity: newPopularity,
          infoValue: newInfoValue
        }
      });
      
      console.log(`✅ Updated ${trait.displayName}: popularity=${newPopularity.toFixed(2)}, infoValue=${newInfoValue.toFixed(2)}`);
    }
    
    console.log('🎉 All traits updated successfully!');
  } catch (error) {
    console.error('❌ Error updating traits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTraits();