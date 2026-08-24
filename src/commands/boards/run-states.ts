import { Result } from "@skapxd/result";

import { readValues } from "@/api/read-values.js";
import { requestAdo } from "@/api/request-ado.js";
import { resolveContext } from "@/context/resolve-context.js";
import type { AdoError } from "@/errors/ado-error.js";

/**
 * Estados reales del workflow de un tipo. Casi siempre están personalizados,
 * así que conviene consultarlos en vez de asumir la plantilla estándar.
 */
export async function runStates(tipo: string): Promise<Result<void, AdoError>> {
  const sinTipo = tipo.length === 0;
  if (sinTipo) {
    return Result.err({
      type: "uso",
      detalle: 'falta el tipo, p. ej. states "Product Backlog Item"',
    });
  }

  const contexto = resolveContext();
  if (Result.isErr(contexto)) return contexto;

  const ctx = contexto.value;
  const respuesta = await requestAdo(
    `${ctx.orgUrl}/${encodeURIComponent(ctx.project)}/_apis/wit/workitemtypes/${encodeURIComponent(tipo)}/states?api-version=7.0`,
  );
  if (Result.isErr(respuesta)) return respuesta;

  const nombres = readValues(respuesta.value).map((estado) => String(estado["name"]));
  console.log(nombres.join(" → "));
  return Result.ok(undefined);
}
