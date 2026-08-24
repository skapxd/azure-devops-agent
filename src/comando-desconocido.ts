import { Result } from "@skapxd/result";

import type { AdoError } from "@/errors/ado-error.js";
import { USAGE } from "@/usage.js";

/**
 * ## comandoDesconocido
 *
 * Error de uso con la ayuda completa adjunta: quien se equivoca de comando
 * necesita ver las opciones ahí mismo, no tener que pedir `--help` aparte.
 *
 * ```ts
 * comandoDesconocido("boards frobnicate"); // Err con la ayuda del CLI
 * ```
 */
export function comandoDesconocido(comando: string): Result<never, AdoError> {
  return Result.err({
    type: "uso",
    detalle: `comando desconocido: ${comando}\n\n${USAGE}`,
  });
}
