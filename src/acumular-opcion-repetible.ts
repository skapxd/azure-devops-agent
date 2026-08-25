/**
 * ## acumularOpcionRepetible
 *
 * Reductor para las opciones de Commander que pueden repetirse.
 *
 * Sin él, `--add a --add b` deja solo `"b"`: Commander sobreescribe salvo que se
 * le dé cómo acumular.
 *
 * ```ts
 * .option("--add <etiqueta>", "…", acumularOpcionRepetible, [])
 * // --add a --add b  ->  ["a", "b"]
 * ```
 */
export function acumularOpcionRepetible(valor: string, previos: string[]): string[] {
  return [...previos, valor];
}
