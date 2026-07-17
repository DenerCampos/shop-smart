/**
 * Formata o nome do item laboratorial para exibição:
 * primeira letra maiúscula e o restante minúsculo (locale pt-BR).
 */
export function formatLabItemDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;

  const first = trimmed.charAt(0).toLocaleUpperCase('pt-BR');
  const rest = trimmed.slice(1).toLocaleLowerCase('pt-BR');
  return `${first}${rest}`;
}
