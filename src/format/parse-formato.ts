import { Result } from "@skapxd/result";

import type { AdoError } from "@/errors/ado-error.js";
import type { Formato } from "@/format/formato.js";
import { FORMATOS } from "@/format/formato.js";

/**
 * ## parseFormato
 *
 * Valida el valor de `--format`.
 *
 * Se rechaza lo desconocido en vez de caer al predeterminado en silencio: quien
 * escribe `--format markdwon` quiere markdown, y darle otra cosa sin avisar le
 * hace perder más tiempo que un error.
 *
 * ```ts
 * parseFormato("json");    // Ok("json")
 * parseFormato("yaml");    // Err({ type: "uso", … })
 * ```
 */
export function parseFormato(valor: string): Result<Formato, AdoError> {
  const esConocido = (FORMATOS as readonly string[]).includes(valor);
  if (!esConocido) {
    return Result.err({
      type: "uso",
      detalle: `formato desconocido: ${valor} (usa ${FORMATOS.join(", ")})`,
    });
  }
  return Result.ok(valor as Formato);
}
