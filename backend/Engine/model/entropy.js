export function calculateEntropy(probabilities) {
let entropy = 0;
for (const p of Object.values(probabilities)) {
if (p > 1e-12) entropy -= p * Math.log2(p);
}
return entropy;
}