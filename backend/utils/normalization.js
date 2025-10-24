export function normalizeUserAnswer(answer) {
if (!answer && answer !== 0) return 'UNKNOWN';
const mapping = new Map([
['YES', 'TRUE'], ['Y', 'TRUE'], ['TRUE', 'TRUE'], ['1', 'TRUE'],
['NO', 'FALSE'], ['N', 'FALSE'], ['FALSE', 'FALSE'], ['0', 'FALSE'],
['SOMETIMES', 'PROBABLY_YES'], ['MAYBE', 'PROBABLY_YES'], ['PROBABLY', 'PROBABLY_YES'], ['LIKELY', 'PROBABLY_YES'],
['PROBABLY_NOT', 'PROBABLY_NO'], ['UNLIKELY', 'PROBABLY_NO'],
['UNKNOWN', 'UNKNOWN'], ['IDK', 'UNKNOWN'], ['DONT_KNOW', 'UNKNOWN'], ["DON'T_KNOW", 'UNKNOWN']
]);


const normalized = String(answer).toUpperCase().trim();
return mapping.get(normalized) || 'UNKNOWN';
}


export function normalizeTraitValue(value) {
if (value === null || value === undefined) return 'UNKNOWN';
return String(value).toUpperCase().trim();
}