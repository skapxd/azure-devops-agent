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

  // La identidad es lo único que necesita red y token. Si falla —PAT de otra
  // organización, sin permisos, sin conexión— el resto del contexto sigue
  // siendo válido: sale del git remote. Reventar entero por un dato accesorio
  // dejaría el comando inservible justo donde más ayuda, que es un repo ajeno.
  const perfil = await requestAdo(
    `https://vssps.dev.azure.com/${encodeURIComponent(ctx.org)}/_apis/profile/profiles/me?api-version=7.0`,
  );
  const identidadNoDisponible = Result.isErr(perfil);
  const identidad = identidadNoDisponible
    ? "(no disponible — el token no vale para esta organización)"
    : ((perfil.value as { emailAddress?: string }).emailAddress ?? "desconocida");

  console.log(renderContexto(ctx, identidad, formato));
  return Result.ok(undefined);
}
