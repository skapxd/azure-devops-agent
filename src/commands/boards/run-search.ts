import { Result } from "@skapxd/result";

import { describeWorkItems } from "@/api/describe-work-items.js";
import { queryWiql } from "@/api/query-wiql.js";
import { resolveContext } from "@/context/resolve-context.js";
import type { AdoError } from "@/errors/ado-error.js";

const DIAS_HACIA_ATRAS = 120;
/** Suficientes para revisar duplicados sin inundar la salida. */
const MAXIMO_RESULTADOS = 20;

/**
 * Busca work items por título antes de crear uno nuevo.
 *
 * Duplicar tickets hace tanto daño como no crearlos: dos tarjetas para la misma
 * tarea significan que nadie sabe cuál es la buena ni dónde está el avance.
 */
export async function runSearch(texto: string): Promise<Result<void, AdoError>> {
  const sinTexto = texto.length === 0;
  if (sinTexto) return Result.err({ type: "uso", detalle: "falta el texto a buscar" });

  const contexto = resolveContext();
  if (Result.isErr(contexto)) return contexto;
  const ctx = contexto.value;

  const escapado = texto.replace(/'/g, "''");
  const ids = await queryWiql(
    ctx.orgUrl,
    ctx.project,
    `SELECT [System.Id] FROM WorkItems ` +
      `WHERE [System.TeamProject] = @project ` +
      `AND [System.Title] CONTAINS '${escapado}' ` +
      `AND [System.ChangedDate] > @today - ${DIAS_HACIA_ATRAS} ` +
      `ORDER BY [System.ChangedDate] DESC`,
  );
  if (Result.isErr(ids)) return ids;

  return describeWorkItems(ctx.orgUrl, ids.value.slice(0, MAXIMO_RESULTADOS));
}
