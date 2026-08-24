import { Result } from "@skapxd/result";

import type { AdoError } from "@/errors/ado-error.js";
import { resolveContext } from "@/context/resolve-context.js";

/** Imprime las coordenadas detectadas del repositorio. */
export function runContext(comoJson: boolean): Result<void, AdoError> {
  const contexto = resolveContext();
  if (Result.isErr(contexto)) return contexto;

  const ctx = contexto.value;
  if (comoJson) {
    console.log(JSON.stringify(ctx, null, 2));
    return Result.ok(undefined);
  }

  console.log(`organización: ${ctx.org}`);
  console.log(`proyecto:     ${ctx.project}`);
  console.log(`repositorio:  ${ctx.repo}`);
  console.log(`url:          ${ctx.orgUrl}`);
  return Result.ok(undefined);
}
