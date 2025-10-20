import { PrismaClient, Typetrait } from '@prisma/client';

const prisma = new PrismaClient();



async function main() {
  // Create a default user
  const user = await prisma.user.upsert({
    where: { email: 'admin@superheroes.com' },
    update: {},
    create: {
      email: 'admin@superheroes.com',
      name: 'Superhero Admin',
    },
  })

  console.log('Created user:', user.email)

  // Define the boolean traits from CSV headers
  const booleanTraits = [
    { key: 'Super Strength', displayName: 'Super Strength' },
    { key: 'Flight', displayName: 'Flight' },
    { key: 'Super Speed', displayName: 'Super Speed' },
    { key: 'Super Intelligence', displayName: 'Super Intelligence' },
    { key: 'Super Durability', displayName: 'Super Durability' },
  ]

  // Define the enum/string traits from CSV
  const enumTraits = [
    { key: 'alignment', displayName: 'Alignment' },
    { key: 'gender', displayName: 'Gender' },
    { key: 'species', displayName: 'Species' },
    { key: 'occupation', displayName: 'Occupation' },
    { key: 'origin', displayName: 'Origin' },
    { key: 'affiliation', displayName: 'Affiliation' },
  ]

  // Create boolean traits
  for (const traitData of booleanTraits) {
    await prisma.trait.upsert({
      where: { key: traitData.key },
      update: {},
      create: {
        ...traitData,
        type: Typetrait.BOOLEAN,
        createdById: user.id,
      },
    })
  }

  // Create enum/string traits
  for (const traitData of enumTraits) {
    await prisma.trait.upsert({
      where: { key: traitData.key },
      update: {},
      create: {
        ...traitData,
        type: Typetrait.ENUM,
        createdById: user.id,
      },
    })
  }

  console.log('Created all traits')

  // CSV data
  const superheroes = [
    { id: 1, name: 'Batman', universe: 'DC', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'True', 'Super Durability': 'False', alignment: 'Good', gender: 'Male', species: 'Human', occupation: 'Vigilante', origin: 'Gotham City', affiliation: 'Justice League' },
    { id: 2, name: 'Superman', universe: 'DC', 'Super Strength': 'True', 'Flight': 'True', 'Super Speed': 'True', 'Super Intelligence': 'True', 'Super Durability': 'True', alignment: 'Good', gender: 'Male', species: 'Kryptonian', occupation: 'Journalist', origin: 'Smallville', affiliation: 'Justice League' },
    { id: 3, name: 'Spider-Man', universe: 'Marvel', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'True', 'Super Intelligence': 'False', 'Super Durability': 'False', alignment: 'Good', gender: 'Male', species: 'Human', occupation: 'Photographer', origin: 'New York City', affiliation: 'Avengers' },
    { id: 4, name: 'Iron Man', universe: 'Marvel', 'Super Strength': 'False', 'Flight': 'True', 'Super Speed': 'False', 'Super Intelligence': 'True', 'Super Durability': 'True', alignment: 'Good', gender: 'Male', species: 'Human', occupation: 'Billionaire', origin: 'New York City', affiliation: 'Avengers' },
    { id: 5, name: 'Wonder Woman', universe: 'DC', 'Super Strength': 'True', 'Flight': 'True', 'Super Speed': 'True', 'Super Intelligence': 'True', 'Super Durability': 'True', alignment: 'Good', gender: 'Female', species: 'Amazonian', occupation: 'Princess', origin: 'Themyscira', affiliation: 'Justice League' },
    { id: 6, name: 'Captain America', universe: 'Marvel', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'False', 'Super Durability': 'True', alignment: 'Good', gender: 'Male', species: 'Human', occupation: 'Soldier', origin: 'Brooklyn', affiliation: 'Avengers' },
    { id: 7, name: 'The Flash', universe: 'DC', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'True', 'Super Intelligence': 'False', 'Super Durability': 'False', alignment: 'Good', gender: 'Male', species: 'Human', occupation: 'Forensic Scientist', origin: 'Central City', affiliation: 'Justice League' },
    { id: 8, name: 'Black Widow', universe: 'Marvel', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'True', 'Super Intelligence': 'True', 'Super Durability': 'False', alignment: 'Good', gender: 'Female', species: 'Human', occupation: 'Assassin', origin: 'Moscow', affiliation: 'Avengers' },
    { id: 9, name: 'Aquaman', universe: 'DC', 'Super Strength': 'True', 'Flight': 'False', 'Super Speed': 'True', 'Super Intelligence': 'False', 'Super Durability': 'True', alignment: 'Good', gender: 'Male', species: 'Atlantean', occupation: 'King', origin: 'Atlantis', affiliation: 'Justice League' },
    { id: 10, name: 'Hulk', universe: 'Marvel', 'Super Strength': 'True', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'False', 'Super Durability': 'True', alignment: 'Neutral', gender: 'Male', species: 'Human/Gamma Mutate', occupation: 'Scientist', origin: 'Dayton', affiliation: 'Avengers' },
    { id: 11, name: 'Gamora', universe: 'Marvel', 'Super Strength': 'True', 'Flight': 'False', 'Super Speed': 'True', 'Super Intelligence': 'True', 'Super Durability': 'True', alignment: 'Neutral', gender: 'Female', species: 'Zehoberei', occupation: 'Assassin', origin: 'Zehoberei', affiliation: 'Guardians of the Galaxy' },
    { id: 12, name: 'Green Lantern', universe: 'DC', 'Super Strength': 'True', 'Flight': 'True', 'Super Speed': 'True', 'Super Intelligence': 'True', 'Super Durability': 'True', alignment: 'Good', gender: 'Male', species: 'Human', occupation: 'Test Pilot', origin: 'Coast City', affiliation: 'Justice League' },
    { id: 13, name: 'Thor', universe: 'Marvel', 'Super Strength': 'True', 'Flight': 'True', 'Super Speed': 'True', 'Super Intelligence': 'False', 'Super Durability': 'True', alignment: 'Good', gender: 'Male', species: 'Asgardian', occupation: 'God of Thunder', origin: 'Asgard', affiliation: 'Avengers' },
    { id: 14, name: 'Black Panther', universe: 'Marvel', 'Super Strength': 'True', 'Flight': 'False', 'Super Speed': 'True', 'Super Intelligence': 'True', 'Super Durability': 'True', alignment: 'Good', gender: 'Male', species: 'Human', occupation: 'King', origin: 'Wakanda', affiliation: 'Avengers' },
    { id: 15, name: 'Cyclops', universe: 'Marvel', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'True', 'Super Durability': 'False', alignment: 'Good', gender: 'Male', species: 'Mutant', occupation: 'Student', origin: 'Neopolis', affiliation: 'X-Men' },
    { id: 16, name: 'Harley Quinn', universe: 'DC', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'False', 'Super Durability': 'False', alignment: 'Neutral', gender: 'Female', species: 'Human', occupation: 'Psychiatrist', origin: 'Gotham City', affiliation: 'Suicide Squad' },
    { id: 17, name: 'Deadpool', universe: 'Marvel', 'Super Strength': 'True', 'Flight': 'False', 'Super Speed': 'True', 'Super Intelligence': 'True', 'Super Durability': 'True', alignment: 'Neutral', gender: 'Male', species: 'Mutant', occupation: 'Mercenary', origin: 'New York City', affiliation: 'X-Force' },
    { id: 18, name: 'Captain Marvel', universe: 'Marvel', 'Super Strength': 'True', 'Flight': 'True', 'Super Speed': 'True', 'Super Intelligence': 'True', 'Super Durability': 'True', alignment: 'Good', gender: 'Female', species: 'Human/Kree Hybrid', occupation: 'US Air Force Pilot', origin: 'Earth', affiliation: 'Avengers' },
    { id: 19, name: 'Green Arrow', universe: 'DC', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'True', 'Super Durability': 'False', alignment: 'Good', gender: 'Male', species: 'Human', occupation: 'Vigilante', origin: 'Star City', affiliation: 'Justice League' },
    { id: 20, name: 'Doctor Strange', universe: 'Marvel', 'Super Strength': 'False', 'Flight': 'True', 'Super Speed': 'False', 'Super Intelligence': 'True', 'Super Durability': 'False', alignment: 'Good', gender: 'Male', species: 'Human', occupation: 'Surgeon', origin: 'New York City', affiliation: 'Avengers' },
    { id: 21, name: 'Catwoman', universe: 'DC', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'True', 'Super Durability': 'False', alignment: 'Neutral', gender: 'Female', species: 'Human', occupation: 'Burglar', origin: 'Gotham City', affiliation: 'Independent' },
    { id: 22, name: 'Storm', universe: 'Marvel', 'Super Strength': 'False', 'Flight': 'True', 'Super Speed': 'True', 'Super Intelligence': 'True', 'Super Durability': 'False', alignment: 'Good', gender: 'Female', species: 'Mutant', occupation: 'Teacher', origin: 'Kenya', affiliation: 'X-Men' },
    { id: 23, name: 'Shazam', universe: 'DC', 'Super Strength': 'True', 'Flight': 'True', 'Super Speed': 'True', 'Super Intelligence': 'False', 'Super Durability': 'True', alignment: 'Good', gender: 'Male', species: 'Human', occupation: 'Student/Foster Child', origin: 'Fawcett City', affiliation: 'Justice League' },
    { id: 24, name: 'Scarlet Witch', universe: 'Marvel', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'True', 'Super Durability': 'False', alignment: 'Neutral', gender: 'Female', species: 'Mutant', occupation: 'Avenger', origin: 'Transia', affiliation: 'Avengers' },
    { id: 25, name: 'Ant-Man', universe: 'Marvel', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'True', 'Super Durability': 'False', alignment: 'Good', gender: 'Male', species: 'Human', occupation: 'Electrical Engineer', origin: 'New York City', affiliation: 'Avengers' },
    { id: 26, name: 'Joker', universe: 'DC', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'True', 'Super Durability': 'False', alignment: 'Evil', gender: 'Male', species: 'Human', occupation: 'Criminal/Gangster', origin: 'Gotham City', affiliation: 'Injustice League' },
    { id: 27, name: 'Loki', universe: 'Marvel', 'Super Strength': 'False', 'Flight': 'True', 'Super Speed': 'False', 'Super Intelligence': 'True', 'Super Durability': 'False', alignment: 'Neutral', gender: 'Male', species: 'Asgardian', occupation: 'Trickster God', origin: 'Asgard', affiliation: 'Independent' },
    { id: 28, name: 'Hawkeye', universe: 'Marvel', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'False', 'Super Durability': 'False', alignment: 'Good', gender: 'Male', species: 'Human', occupation: 'Vigilante', origin: 'New York City', affiliation: 'Avengers' },
    { id: 29, name: 'Supergirl', universe: 'DC', 'Super Strength': 'True', 'Flight': 'True', 'Super Speed': 'True', 'Super Intelligence': 'True', 'Super Durability': 'True', alignment: 'Good', gender: 'Female', species: 'Kryptonian', occupation: 'Reporter', origin: 'Earth', affiliation: 'Justice League' },
    { id: 30, name: 'Red Hood', universe: 'DC', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'False', 'Super Durability': 'False', alignment: 'Neutral', gender: 'Male', species: 'Human', occupation: 'Vigilante', origin: 'Gotham City', affiliation: 'Outlaw' },
    { id: 31, name: 'Star-Lord', universe: 'Marvel', 'Super Strength': 'False', 'Flight': 'True', 'Super Speed': 'False', 'Super Intelligence': 'True', 'Super Durability': 'False', alignment: 'Good', gender: 'Male', species: 'Human', occupation: 'Space Explorer', origin: 'Earth', affiliation: 'Guardians of the Galaxy' },
    { id: 32, name: 'Robin', universe: 'DC', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'False', 'Super Durability': 'False', alignment: 'Good', gender: 'Male', species: 'Human', occupation: 'Vigilante', origin: 'Gotham City', affiliation: 'Teen Titans' },
    { id: 33, name: 'Groot', universe: 'Marvel', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'False', 'Super Durability': 'True', alignment: 'Good', gender: 'Male', species: 'Flora Colossus', occupation: 'Guardians of the Galaxy', origin: 'Planet X', affiliation: 'Guardians of the Galaxy' },
    { id: 34, name: 'Deadshot', universe: 'DC', 'Super Strength': 'False', 'Flight': 'False', 'Super Speed': 'False', 'Super Intelligence': 'False', 'Super Durability': 'False', alignment: 'Neutral', gender: 'Male', species: 'Human', occupation: 'Mercenary', origin: 'Gotham City', affiliation: 'Suicide Squad' },
    { id: 35, name: 'Wolverine', universe: 'Marvel', 'Super Strength': 'True', 'Flight': 'False', 'Super Speed': 'True', 'Super Intelligence': 'False', 'Super Durability': 'True', alignment: 'Neutral', gender: 'Male', species: 'Mutant', occupation: 'Soldier', origin: 'Canada', affiliation: 'X-Men' },
  ]

  // Create characters and their traits
  for (const hero of superheroes) {
    // Create character
    const character = await prisma.character.create({
      data: {
        name: hero.name,
        universe: hero.universe,
        aliases: [], // You can add aliases if available
        createdById: user.id,
      },
    })

    console.log(`Created character: ${hero.name}`)

    // Get all traits
    const allTraits = await prisma.trait.findMany()

    // Create character traits
    for (const trait of allTraits) {
      let value = ''

      if (trait.type === Typetrait.BOOLEAN) {
        // Handle boolean traits
        value = hero[trait.key] === 'True' ? 'TRUE' : 'FALSE'
      } else if (trait.type === Typetrait.ENUM) {
        // Handle enum/string traits
        value = hero[trait.key] || 'UNKNOWN'
      }

      if (value) {
        await prisma.characterTrait.create({
          data: {
            characterId: character.id,
            traitId: trait.id,
            value: value,
          },
        })
      }
    }
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })