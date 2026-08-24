import { Result } from "@skapxd/result";

import { requestAdo } from "@/api/request-ado.js";
import { resolveContext } from "@/context/resolve-context.js";
import type { AdoError } from "@/errors/ado-error.js";

/** Valida el token y muestra con qué identidad se está trabajando. */
export async function runCheck(): Promise<Result<void, AdoError>> {
  const contexto = resolveContext();
  if (Result.isErr(contexto)) return contexto;

  const ctx = contexto.value;
  const perfil = await requestAdo(
    `https://vssps.dev.azure.com/${encodeURIComponent(ctx.org)}/_apis/profile/profiles/me?api-version=7.0`,
  );
  if (Result.isErr(perfil)) return perfil;

  const { emailAddress } = perfil.value as { emailAddress?: string };
  console.log(`organización: ${ctx.org}`);
  console.log(`proyecto:     ${ctx.project}`);
  console.log(`repositorio:  ${ctx.repo}`);
  console.log(`identidad:    ${emailAddress ?? "desconocida"}`);
  return Result.ok(undefined);
}
