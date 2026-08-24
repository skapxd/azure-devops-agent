import { Result } from "@skapxd/result";

import { describeWorkItems } from "@/api/describe-work-items.js";
import { queryWiql } from "@/api/query-wiql.js";
/** Tope de la lista: más que esto deja de ser una vista útil de trabajo abierto. */
const MAXIMO_PENDIENTES = 50;

import { resolveContext } from "@/context/resolve-context.js";
import type { AdoError } from "@/errors/ado-error.js";

/**
 * Trabajo abierto de una persona.
 *
 * Se filtra por correo explícito y no con `@Me`: `@Me` resuelve a la identidad
 * del token, que no siempre es la cuenta con la que se trabaja en el portal — y
 * entonces devuelve cero y parece que no hay nada asignado.
 */
export async function runList(correo: string): Promise<Result<void, AdoError>> {
  const sinCorreo = !correo;
  if (sinCorreo) {
    return Result.err({
      type: "uso",
      detalle: "falta --assignee <correo> (usa `check` para ver el tuyo)",
    });
  }

  const contexto = resolveContext();
  if (Result.isErr(contexto)) return contexto;
  const ctx = contexto.value;

  const escapado = correo.replace(/'/g, "''");
  const ids = await queryWiql(
    ctx.orgUrl,
    ctx.project,
    `SELECT [System.Id] FROM WorkItems ` +
      `WHERE [System.TeamProject] = @project ` +
      `AND [System.AssignedTo] = '${escapado}' ` +
      `AND [System.State] NOT IN ('Done','Closed','Removed') ` +
      `ORDER BY [System.ChangedDate] DESC`,
  );
  if (Result.isErr(ids)) return ids;

  return describeWorkItems(ctx.orgUrl, ids.value.slice(0, MAXIMO_PENDIENTES));
}
