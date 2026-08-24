import { Result } from "@skapxd/result";

import { requestAdo } from "@/api/request-ado.js";
import { resolveContext } from "@/context/resolve-context.js";
import type { AdoError } from "@/errors/ado-error.js";

/**
 * ## runContext
 *
 * Todo lo que hace falta para invocar `az` en este repositorio: organización,
 * proyecto, repositorio y la identidad del token.
 *
 * `az` sabe autodetectar la organización con `--detect`, pero no el proyecto, y
 * no tiene forma directa de responder "¿con qué cuenta estoy trabajando?" —
 * dato necesario para asignar work items sin adivinar correos.
 *
 * ```bash
 * ado context --json
 * # { "org": "MiOrg", "project": "MiProyecto", … , "identity": "yo@ejemplo.com" }
 * ```
 */
export async function runContext(comoJson: boolean): Promise<Result<void, AdoError>> {
  const contexto = resolveContext();
  if (Result.isErr(contexto)) return contexto;
  const ctx = contexto.value;

  const perfil = await requestAdo(
    `https://vssps.dev.azure.com/${encodeURIComponent(ctx.org)}/_apis/profile/profiles/me?api-version=7.0`,
  );
  if (Result.isErr(perfil)) return perfil;

  const { emailAddress } = perfil.value as { emailAddress?: string };
  const identidad = emailAddress ?? "desconocida";

  if (comoJson) {
    console.log(JSON.stringify({ ...ctx, identity: identidad }, null, 2));
    return Result.ok(undefined);
  }

  console.log(`organización: ${ctx.org}`);
  console.log(`proyecto:     ${ctx.project}`);
  console.log(`repositorio:  ${ctx.repo}`);
  console.log(`url:          ${ctx.orgUrl}`);
  console.log(`identidad:    ${identidad}`);
  return Result.ok(undefined);
}
