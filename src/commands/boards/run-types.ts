import { Result } from "@skapxd/result";

import { readValues } from "@/api/read-values.js";
import { requestAdo } from "@/api/request-ado.js";
import { resolveContext } from "@/context/resolve-context.js";
import type { AdoError } from "@/errors/ado-error.js";

/** Lista los tipos de work item del proyecto, que dependen de su plantilla. */
export async function runTypes(): Promise<Result<void, AdoError>> {
  const contexto = resolveContext();
  if (Result.isErr(contexto)) return contexto;

  const ctx = contexto.value;
  const respuesta = await requestAdo(
    `${ctx.orgUrl}/${encodeURIComponent(ctx.project)}/_apis/wit/workitemtypes?api-version=7.0`,
  );
  if (Result.isErr(respuesta)) return respuesta;

  for (const tipo of readValues(respuesta.value)) console.log(`- ${String(tipo["name"])}`);
  return Result.ok(undefined);
}
