/**
 * Aplica trim e capitaliza apenas a primeira letra da string
 * @param value - Valor a ser transformado
 * @returns String transformada ou valor original se não for string
 */
export const capitalizeFirstLetter = (value: any): any => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return trimmed;
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/**
 * Apenas aplica trim na string
 */
export const trimString = (value: any): any => {
  return typeof value === 'string' ? value.trim() : value;
};

/**
 * Capitaliza todas as palavras (Title Case)
 */
export const capitalizeWords = (value: any): any => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  return trimmed
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
