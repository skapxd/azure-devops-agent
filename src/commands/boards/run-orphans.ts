import { execFileSync } from "node:child_process";

import { Result, trySafe } from "@skapxd/result";

import { filtrarRamasSinWorkItem } from "@/commands/boards/filtrar-ramas-sin-work-item.js";
import type { AdoError } from "@/errors/ado-error.js";
import type { Formato } from "@/format/formato.js";
import { renderRamasHuerfanas } from "@/format/render-ramas-huerfanas.js";

/**
 * ## runOrphans
 *
 * Lista las ramas locales que no referencian ningún work item.
 *
 * Es el caso que más trabajo pierde: una rama sin número nace de un arreglo
 * rápido, se mergea, y nunca deja rastro en el tablero. Detectarlas es la forma
 * barata de recuperar esa trazabilidad antes de que se olvide del todo.
 *
 * ```bash
 * ado boards orphans
 * ```
 */
export function runOrphans(formato: Formato): Result<void, AdoError> {
  const ramas = trySafe(() =>
    execFileSync("git", ["branch", "--format=%(refname:short)"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );

  const gitFallo = Result.isErr(ramas);
  if (gitFallo) return Result.err({ type: "sin-repo" });

  console.log(renderRamasHuerfanas(filtrarRamasSinWorkItem(ramas.value), formato));
  return Result.ok(undefined);
}
