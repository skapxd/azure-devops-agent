import { execFileSync } from "node:child_process";

import { Result, trySafe } from "@skapxd/result";

import { filtrarRamasSinWorkItem } from "@/commands/branches/filtrar-ramas-sin-work-item.js";
import { ramaPorDefecto } from "@/commands/branches/rama-por-defecto.js";
import type { AdoError } from "@/errors/ado-error.js";
import type { Formato } from "@/format/formato.js";
import { renderRamasSinEnlazar } from "@/commands/branches/render-ramas-sin-enlazar.js";

/**
 * ## runUnlinked
 *
 * Lista las ramas locales que no referencian ningún work item.
 *
 * Es el caso que más trabajo pierde: una rama sin número nace de un arreglo
 * rápido, se mergea, y nunca deja rastro en el tablero. Detectarlas es la forma
 * barata de recuperar esa trazabilidad antes de que se olvide del todo.
 *
 * Se excluyen las ramas base (`main`, `dev`, `release/*`…) y la principal del
 * remote: nunca tienen ticket, y reportarlas taparía las que sí importan.
 *
 * ```bash
 * npx @skapxd/azure-devops-agent branches unlinked
 * ```
 */
export function runUnlinked(formato: Formato): Result<void, AdoError> {
  const ramas = trySafe(() =>
    execFileSync("git", ["branch", "--format=%(refname:short)"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );

  const gitFallo = Result.isErr(ramas);
  if (gitFallo) return Result.err({ type: "sin-repo" });

  const huerfanas = filtrarRamasSinWorkItem(ramas.value, ramaPorDefecto());
  console.log(renderRamasSinEnlazar(huerfanas, formato));
  return Result.ok(undefined);
}
