import { getTraitUniqueCharacterValues } from '../data/repositories/traitRepository.js';


export function getPossibleAnswersSync(trait, characters) {
if (trait.type === 'BOOLEAN') return ['YES', 'NO', 'PROBABLY', 'PROBABLY_NOT', 'UNKNOWN'];
if (trait.type === 'ENUM') {
const set = new Set();
for (const char of characters) {
const t = char.traits.find(x => x.traitId === trait.id);
if (t && t.value && t.value !== 'UNKNOWN') set.add(t.value);
}
return set.size ? [...set, 'UNKNOWN'] : ['UNKNOWN'];
}
return ['YES', 'NO', 'UNKNOWN'];
}


export async function getPossibleAnswers(trait) {
if (trait.type === 'BOOLEAN') return ['YES', 'NO', 'PROBABLY', 'PROBABLY_NOT', 'UNKNOWN'];
if (trait.type === 'ENUM') {
const values = await getTraitUniqueCharacterValues(trait.id);
return values.length ? [...values.slice(0, 8), 'UNKNOWN'] : ['UNKNOWN'];
}
return ['YES', 'NO', 'UNKNOWN'];
}