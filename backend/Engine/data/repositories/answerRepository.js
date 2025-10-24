import { prisma } from '../../../lib/prisma.js';


export async function getAnswersForSession(sessionId) {
return prisma.answerLog.findMany({ where: { sessionId }, orderBy: { answeredAt: 'asc' } });
}