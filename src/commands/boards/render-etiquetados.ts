import { match } from "ts-pattern";

import type { Etiquetado } from "@/commands/boards/etiquetado.js";
import type { Formato } from "@/format/formato.js";

/**
 * ## renderEtiquetados
 *
 * Formatea el resultado de estampar la huella en uno o varios work items.
 *
 * Distingue lo escrito de lo que ya estaba: al estampar en lote importa saber
 * cuáles se tocaron de verdad, porque solo esos generan una revisión nueva y
 * notifican a quien siga el work item.
 *
 * ```ts
 * renderEtiquetados([{ id: "11607", etiquetas: ["agent"], cambiado: true }], "text");
 * // #11607  agent  (añadida)
 * ```
 */
export function renderEtiquetados(
  etiquetados: readonly Etiquetado[],
  formato: Formato,
): string {
  return match(formato)
    .with("json", () => JSON.stringify({ tagged: etiquetados }, null, 2))
    .with("text", () =>
      etiquetados
        .map(
          (e) =>
            `#${e.id}  ${e.etiquetas.join(", ")}  (${e.cambiado ? "añadida" : "ya la tenía"})`,
        )
        .join("\n"),
    )
    .with("markdown", () =>
      [
        `**Huella estampada** en ${String(etiquetados.length)} work item(s):`,
        "",
        ...etiquetados.map(
          (e) =>
            `- #${e.id} — \`${e.etiquetas.join("`, `")}\`${e.cambiado ? "" : " _(ya la tenía)_"}`,
        ),
      ].join("\n"),
    )
    .exhaustive();
}
