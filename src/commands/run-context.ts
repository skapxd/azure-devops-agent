import { Result } from "@skapxd/result";

import { requestAdo } from "@/api/request-ado.js";
import { resolveContext } from "@/context/resolve-context.js";
import type { AdoError } from "@/errors/ado-error.js";
import type { Formato } from "@/format/formato.js";
import { renderContexto } from "@/format/render-contexto.js";

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
 * ado context --format json
 * # { "org": "MiOrg", "project": "MiProyecto", …, "identity": "yo@ejemplo.com" }
 * ```
 */
export async function runContext(formato: Formato): Promise<Result<void, AdoError>> {
  const contexto = resolveContext();
  if (Result.isErr(contexto)) return contexto;
  const ctx = contexto.value;

  const perfil = await requestAdo(
    `https://vssps.dev.azure.com/${encodeURIComponent(ctx.org)}/_apis/profile/profiles/me?api-version=7.0`,
  );
  if (Result.isErr(perfil)) return perfil;

  const { emailAddress } = perfil.value as { emailAddress?: string };
  console.log(renderContexto(ctx, emailAddress ?? "desconocida", formato));
  return Result.ok(undefined);
}
