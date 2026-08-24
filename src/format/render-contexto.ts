import { match } from "ts-pattern";

import type { AdoContext } from "@/context/ado-context.js";
import type { Formato } from "@/format/formato.js";

/**
 * ## renderContexto
 *
 * Formatea el contexto del repositorio.
 *
 * ```ts
 * renderContexto(ctx, "yo@ejemplo.com", "markdown");
 * // | Campo | Valor |
 * // | --- | --- |
 * // | Organización | MiOrg |
 * ```
 */
export function renderContexto(
  contexto: AdoContext,
  identidad: string,
  formato: Formato,
): string {
  return match(formato)
    .with("json", () => JSON.stringify({ ...contexto, identity: identidad }, null, 2))
    .with("text", () =>
      [
        `organización: ${contexto.org}`,
        `proyecto:     ${contexto.project}`,
        `repositorio:  ${contexto.repo}`,
        `url:          ${contexto.orgUrl}`,
        `identidad:    ${identidad}`,
      ].join("\n"),
    )
    .with("markdown", () =>
      [
        "| Campo | Valor |",
        "| --- | --- |",
        `| Organización | \`${contexto.org}\` |`,
        `| Proyecto | \`${contexto.project}\` |`,
        `| Repositorio | \`${contexto.repo}\` |`,
        `| URL | ${contexto.orgUrl} |`,
        `| Identidad | \`${identidad}\` |`,
      ].join("\n"),
    )
    .exhaustive();
}
