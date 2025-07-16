/**
 * Calcula a distância de Jaro entre duas strings
 */
function jaroDistance(s1: string, s2: string): number {
  if (s1 === s2) return 1;

  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0 || len2 === 0) return 0;

  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  if (matchWindow < 0) return 0;

  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Identifica matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, len2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Calcula transposições
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / len1 +
      matches / len2 +
      (matches - transpositions / 2) / matches) /
    3
  );
}

/**
 * Calcula a distância de Jaro-Winkler entre duas strings
 */
function jaroWinklerDistance(s1: string, s2: string): number {
  const jaroSim = jaroDistance(s1, s2);

  if (jaroSim < 0.7) return jaroSim;

  // Calcula prefixo comum (máximo 4 caracteres)
  let prefixLength = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
    if (s1[i] === s2[i]) {
      prefixLength++;
    } else {
      break;
    }
  }

  return jaroSim + 0.1 * prefixLength * (1 - jaroSim);
}

/**
 * Normaliza uma string para comparação
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove caracteres especiais
    .replace(/\s+/g, ' ') // Remove espaços extras
    .trim();
}

/**
 * Encontra a string mais similar em um array
 * @param {string} target - String alvo para comparar
 * @param {string[]} candidates - Array de strings candidatas
 * @param {number} threshold - Limite mínimo de similaridade (0-1)
 * @returns {Object|null} - Objeto com a string encontrada e sua similaridade, ou null
 */
export const findSimilarString = (
  target: string,
  candidates: string[],
  threshold = 0.7,
): { match: string; similarity: number; target: string } | null => {
  if (!target || !Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const normalizedTarget = normalizeString(target);
  let bestMatch = null;
  let bestSimilarity = 0;

  for (const candidate of candidates) {
    if (!candidate) continue;

    const normalizedCandidate = normalizeString(candidate);
    const similarity = jaroWinklerDistance(
      normalizedTarget,
      normalizedCandidate,
    );

    if (similarity >= threshold && similarity > bestSimilarity) {
      bestMatch = candidate;
      bestSimilarity = similarity;
    }
  }

  return bestMatch
    ? {
        match: bestMatch,
        similarity: Math.round(bestSimilarity * 100),
        target: target,
      }
    : null;
};
