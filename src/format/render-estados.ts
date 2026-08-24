import { match } from "ts-pattern";

import type { Formato } from "@/format/formato.js";

/**
 * ## renderEstados
 *
 * Formatea los estados del workflow de un tipo de work item.
 *
 * En markdown va como lista ordenada porque el orden **es** la información: son
 * las etapas por las que pasa el trabajo, no un conjunto sin estructura.
 *
 * ```ts
 * renderEstados("Task", ["To Do", "Done"], "markdown");
 * // Estados de `Task`:
 * //
 * // 1. To Do
 * // 2. Done
 * ```
 */
export function renderEstados(
  tipo: string,
  estados: readonly string[],
  formato: Formato,
): string {
  return match(formato)
    .with("json", () => JSON.stringify({ type: tipo, states: estados }, null, 2))
    .with("text", () => estados.join(" → "))
    .with("markdown", () =>
      [
        `Estados de \`${tipo}\`:`,
        "",
        ...estados.map((estado, i) => `${String(i + 1)}. ${estado}`),
      ].join("\n"),
    )
    .exhaustive();
}
