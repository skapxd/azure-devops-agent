import { match } from "ts-pattern";

import type { Formato } from "@/format/formato";
import type { WorkItemCreado } from "@/commands/boards/work-item-creado";

/**
 * ## renderWorkItemCreado
 *
 * Formatea el resultado de crear un work item.
 *
 * ```ts
 * renderWorkItemCreado({ id: 11607, title: "x", parent: "11603", url: "…" }, "markdown");
 * // Creado **#11607** — x
 * //
 * // - Padre: #11603
 * ```
 */
export function renderWorkItemCreado(
  creado: WorkItemCreado,
  formato: Formato,
): string {
  return match(formato)
    .with("json", () => JSON.stringify(creado, null, 2))
    .with("text", () =>
      `#${String(creado.id)}  ${creado.title}  (hijo de #${creado.parent})\n${creado.url}`,
    )
    .with("markdown", () =>
      [
        `Creado **#${String(creado.id)}** — ${creado.title}`,
        "",
        `- Padre: #${creado.parent}`,
        `- URL: ${creado.url}`,
      ].join("\n"),
    )
    .exhaustive();
}
