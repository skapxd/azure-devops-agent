import { Result } from "@skapxd/result";

import { fetchJson } from "@/api/fetch-json";
import { sendPatch } from "@/api/send-patch";
import { combinarEtiquetas } from "@/commands/boards/combinar-etiquetas";
import { ETIQUETA_AGENTE } from "@/commands/boards/etiqueta-agente";
import type { Etiquetado } from "@/commands/boards/etiquetado";
import { leerCampoDeEtiquetas } from "@/commands/boards/leer-campo-de-etiquetas";
import { renderEtiquetados } from "@/commands/boards/render-etiquetados";
import { separarEtiquetas } from "@/commands/boards/separar-etiquetas";
import type { CliError } from "@/errors/cli-error";
import type { Formato } from "@/format/formato";
import { locateRepo } from "@/repo/locate-repo";

/**
 * ## runTag
 *
 * Añade la huella del agente a work items que ya existen, sin pisar las
 * etiquetas que tuvieran.
 *
 * `az boards work-item update --fields "System.Tags=..."` asigna el campo
 * entero, así que usarlo para añadir borra lo demás. Aquí se lee primero y se
 * escribe la unión, que es lo que `az` no sabe hacer en un solo comando.
 *
 * Es idempotente: si la etiqueta ya está, no escribe. Eso importa porque cada
 * escritura crea una revisión en el historial y notifica a quien siga el work
 * item — estampar dos veces no debe ensuciar el rastro de nadie.
 *
 * ```ts
 * await runTag(["11604", "11605"], [], "text");
 * // #11604  agent  (añadida)
 * // #11605  agent  (ya la tenía)
 * ```
 */
export async function runTag(
  ids: readonly string[],
  extras: readonly string[],
  formato: Formato,
): Promise<Result<void, CliError>> {
  const repo = locateRepo();
  if (Result.isErr(repo)) return repo;
  const ctx = repo.value;

  const aAnadir = [ETIQUETA_AGENTE, ...extras];
  const etiquetados: Etiquetado[] = [];

  for (const id of ids) {
    const url = `${ctx.orgUrl}/${encodeURIComponent(ctx.project)}/_apis/wit/workitems/${encodeURIComponent(id)}?fields=System.Tags&api-version=7.0`;

    const actual = await fetchJson(url);
    if (Result.isErr(actual)) return actual;

    const campoActual = leerCampoDeEtiquetas(actual.value);
    const combinadas = combinarEtiquetas(campoActual, aAnadir);

    const yaEstaban = combinadas === null;
    if (yaEstaban) {
      etiquetados.push({
        id,
        etiquetas: separarEtiquetas(campoActual),
        cambiado: false,
      });
      continue;
    }

    const escrito = await sendPatch(
      `${ctx.orgUrl}/${encodeURIComponent(ctx.project)}/_apis/wit/workitems/${encodeURIComponent(id)}?api-version=7.0`,
      [{ op: "add", path: "/fields/System.Tags", value: combinadas }],
      "PATCH",
    );
    if (Result.isErr(escrito)) return escrito;

    etiquetados.push({ id, etiquetas: separarEtiquetas(combinadas), cambiado: true });
  }

  console.log(renderEtiquetados(etiquetados, formato));
  return Result.ok(undefined);
}
