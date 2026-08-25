/**
 * ## conSangria
 *
 * Sangra un valor dos espacios, para listas en texto plano.
 *
 * ```ts
 * conSangria("feat/algo"); // "  feat/algo"
 * ```
 */
export function conSangria(valor: string): string {
  return `  ${valor}`;
}
