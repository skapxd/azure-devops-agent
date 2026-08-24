import { execFileSync } from "node:child_process";

import { Result, trySafe } from "@skapxd/result";

import { filtrarRamasSinWorkItem } from "@/commands/boards/filtrar-ramas-sin-work-item.js";
import type { AdoError } from "@/errors/ado-error.js";

/**
 * ## runOrphans
 *
 * Lista las ramas locales que no referencian ningún work item.
 *
 * Es el caso que más trabajo pierde: una rama sin número nace de un arreglo
 * rápido, se mergea, y nunca deja rastro en el tablero. Detectarlas es la forma
 * barata de recuperar esa trazabilidad antes de que se olvide del todo.
 *
 * ```ts
 * runOrphans();
 * // Ramas sin work item asociado:
 * //   back/n-a/duplicar-concesionarios-con-etiqueta
 * ```
 */
export function runOrphans(): Result<void, AdoError> {
  const ramas = trySafe(() =>
    execFileSync("git", ["branch", "--format=%(refname:short)"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );

  const gitFallo = Result.isErr(ramas);
  if (gitFallo) return Result.err({ type: "sin-repo" });

  const huerfanas = filtrarRamasSinWorkItem(ramas.value);
  const todasTienenNumero = huerfanas.length === 0;
  if (todasTienenNumero) {
    console.log("(ninguna — todas las ramas referencian un work item)");
    return Result.ok(undefined);
  }

  console.log("Ramas sin work item asociado:");
  for (const rama of huerfanas) console.log(`  ${rama}`);
  return Result.ok(undefined);
}
