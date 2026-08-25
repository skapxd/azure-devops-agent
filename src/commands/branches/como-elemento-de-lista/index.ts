/**
 * ## comoElementoDeLista
 *
 * Convierte un valor en un elemento de lista markdown con formato de código.
 *
 * El backtick importa: los nombres de rama llevan barras y guiones que markdown
 * interpretaría, y sin él una rama como `feat/x_y_z` se renderiza con cursivas.
 *
 * ```ts
 * comoElementoDeLista("feat/algo"); // "- `feat/algo`"
 * ```
 */
export function comoElementoDeLista(valor: string): string {
  return `- \`${valor}\``;
}
