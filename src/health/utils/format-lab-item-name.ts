/**
 * Formata o nome do item laboratorial (persistência e exibição):
 * cada palavra com a primeira letra maiúscula e o restante minúsculo (pt-BR).
 * Preserva pontuação inicial (ex.: "(Hemograma)" → "(Hemograma)").
 * Tokens que começam com dígito ficam em minúsculas (ex.: "24H" → "24h").
 */
export function formatLabItemDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;

  return trimmed
    .split(/\s+/)
    .map((word) => formatLabItemWord(word))
    .join(' ');
}

function formatLabItemWord(word: string): string {
  if (!word) return word;

  if (/^\d/.test(word)) {
    return word.toLocaleLowerCase('pt-BR');
  }

  let i = 0;
  while (i < word.length && !isLetter(word.charAt(i))) {
    i += 1;
  }
  if (i >= word.length) {
    return word.toLocaleLowerCase('pt-BR');
  }

  const before = word.slice(0, i);
  const first = word.charAt(i).toLocaleUpperCase('pt-BR');
  const rest = word.slice(i + 1).toLocaleLowerCase('pt-BR');
  return `${before}${first}${rest}`;
}

function isLetter(char: string): boolean {
  return /\p{L}/u.test(char);
}
