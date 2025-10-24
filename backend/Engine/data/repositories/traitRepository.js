import { prisma } from '../../../lib/prisma.js';


export async function getActiveTraits() {
return prisma.trait.findMany({ where: { active: true } });
}


export async function getTraitById(id) {
return prisma.trait.findUnique({ where: { id } });
}


export async function getTraitQuestions(traitId) {
return prisma.question.findMany({ where: { traitId, active: true } });
}


export async function getTraitUniqueCharacterValues(traitId) {
const trait = await prisma.trait.findUnique({
where: { id: traitId },
include: { characterTraits: { select: { value: true }, distinct: ['value'] } }
});
if (!trait) return [];
return trait.characterTraits.map(ct => ct.value).filter(v => v && v !== 'UNKNOWN');
}