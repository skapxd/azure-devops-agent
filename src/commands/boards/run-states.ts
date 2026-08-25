import { Result } from "@skapxd/result";

import { readValues } from "@/api/read-values.js";
import { requestAdo } from "@/api/request-ado.js";
import { resolveContext } from "@/context/resolve-context.js";
import type { AdoError } from "@/errors/ado-error.js";
import type { Formato } from "@/format/formato.js";
import { renderEstados } from "@/commands/boards/render-estados.js";

/**
 * ## runStates
 *
 * Estados reales del workflow de un tipo de work item.
 *
 * `az` no los expone, y casi todos los proyectos los tienen personalizados: usar
 * un estado que no existe falla, y usar uno que existe pero significa otra cosa
 * desordena el tablero de todos.
 *
 * ```bash
 * npx @skapxd/azure-devops-agent boards states "Product Backlog Item"
 * ```
 */
export async function runStates(
  tipo: string,
  formato: Formato,
): Promise<Result<void, AdoError>> {
  const contexto = resolveContext();
  if (Result.isErr(contexto)) return contexto;
  const ctx = contexto.value;

  const respuesta = await requestAdo(
    `${ctx.orgUrl}/${encodeURIComponent(ctx.project)}/_apis/wit/workitemtypes/${encodeURIComponent(tipo)}/states?api-version=7.0`,
  );
  if (Result.isErr(respuesta)) return respuesta;

  const estados = readValues(respuesta.value).map((estado) => String(estado["name"]));
  console.log(renderEstados(tipo, estados, formato));
  return Result.ok(undefined);
}
