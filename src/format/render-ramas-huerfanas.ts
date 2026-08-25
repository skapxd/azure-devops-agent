import { match } from "ts-pattern";

import { comoElementoDeLista } from "@/format/como-elemento-de-lista.js";
import { conSangria } from "@/format/con-sangria.js";
import type { Formato } from "@/format/formato.js";

const SIN_HUERFANAS = "(ninguna — no hay ramas de trabajo sin registrar)";

/**
 * ## renderRamasHuerfanas
 *
 * Formatea las ramas que no referencian ningún work item.
 *
 * ```ts
 * renderRamasHuerfanas(["fix/algo"], "markdown");
 * // **1 rama sin work item asociado:**
 * //
 * // - `fix/algo`
 * ```
 */
export function renderRamasHuerfanas(
  ramas: readonly string[],
  formato: Formato,
): string {
  // El caso vacío se resuelve antes del match: en JSON sigue siendo una lista
  // (vacía, pero parseable), mientras que para leer se prefiere una frase.
  const noHayNinguna = ramas.length === 0;
  const seLeeEnPantalla = formato !== "json";
  const bastaConDecirloEnUnaFrase = noHayNinguna && seLeeEnPantalla;
  if (bastaConDecirloEnUnaFrase) return SIN_HUERFANAS;

  const plural = ramas.length === 1 ? "rama" : "ramas";
  const encabezado = `**${String(ramas.length)} ${plural} sin work item asociado:**`;

  return match(formato)
    .with("json", () => JSON.stringify({ orphans: ramas }, null, 2))
    .with("text", () =>
      ["Ramas sin work item asociado:", ...ramas.map(conSangria)].join("\n"),
    )
    .with("markdown", () =>
      [encabezado, "", ...ramas.map(comoElementoDeLista)].join("\n"),
    )
    .exhaustive();
}
