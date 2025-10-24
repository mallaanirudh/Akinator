import { prisma } from '../../../lib/prisma.js';


export async function getAllCharactersWithTraits() {
return prisma.character.findMany({ include: { traits: { include: { trait: true } } } });
}


export async function getCharacters() {
return prisma.character.findMany();
}