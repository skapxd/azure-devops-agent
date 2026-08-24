import { Result } from "@skapxd/result";

import { readValues } from "@/api/read-values.js";
import { requestAdo } from "@/api/request-ado.js";
import { resolveContext } from "@/context/resolve-context.js";
import type { AdoError } from "@/errors/ado-error.js";

/** Ruta del sprint en curso; vacío si el equipo no tiene ninguno activo. */
export async function runIteration(): Promise<Result<void, AdoError>> {
  const contexto = resolveContext();
  if (Result.isErr(contexto)) return contexto;

  const ctx = contexto.value;
  const respuesta = await requestAdo(
    `${ctx.orgUrl}/${encodeURIComponent(ctx.project)}/_apis/work/teamsettings/iterations?api-version=7.0&$timeframe=current`,
  );
  if (Result.isErr(respuesta)) return respuesta;

  const actual = readValues(respuesta.value)[0];
  console.log(String(actual?.["path"] ?? ""));
  return Result.ok(undefined);
}
