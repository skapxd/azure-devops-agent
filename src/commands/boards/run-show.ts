import { Result } from "@skapxd/result";

import { requestAdo } from "@/api/request-ado.js";
import { idDeUrl } from "@/commands/boards/id-de-url.js";
import { resolveContext } from "@/context/resolve-context.js";
import type { AdoError } from "@/errors/ado-error.js";

const HIJO = "System.LinkTypes.Hierarchy-Forward";
const PADRE = "System.LinkTypes.Hierarchy-Reverse";

interface Relacion {
  readonly rel: string;
  readonly url: string;
}

/**
 * ## runShow
 *
 * Muestra un work item con su padre y sus hijos, para ver dónde encaja en el
 * árbol sin abrir el portal.
 *
 * ```ts
 * runShow("11603");
 * // #11603  Duplicar concesionarios con etiqueta
 * //   hijos:     #11604, #11605
 * ```
 */
export async function runShow(id: string): Promise<Result<void, AdoError>> {
  const sinId = !id;
  if (sinId) return Result.err({ type: "uso", detalle: "falta el id del work item" });

  const contexto = resolveContext();
  if (Result.isErr(contexto)) return contexto;
  const ctx = contexto.value;

  const respuesta = await requestAdo(
    `${ctx.orgUrl}/_apis/wit/workitems/${encodeURIComponent(id)}?api-version=7.0&$expand=relations`,
  );
  if (Result.isErr(respuesta)) return respuesta;

  const item = respuesta.value as {
    fields: Record<string, unknown>;
    relations?: readonly Relacion[];
  };
  const campos = item.fields;
  const responsable = campos["System.AssignedTo"] as { uniqueName?: string } | undefined;

  console.log(`#${id}  ${String(campos["System.Title"])}`);
  console.log(`  tipo:      ${String(campos["System.WorkItemType"])}`);
  console.log(`  estado:    ${String(campos["System.State"])}`);
  console.log(`  asignado:  ${responsable?.uniqueName ?? "sin asignar"}`);
  console.log(`  iteración: ${String(campos["System.IterationPath"])}`);

  const relaciones = item.relations ?? [];
  const padres = relaciones.filter((r) => r.rel === PADRE).map((r) => idDeUrl(r.url));
  const hijos = relaciones.filter((r) => r.rel === HIJO).map((r) => idDeUrl(r.url));

  const cuelgaDeUnaHistoria = padres.length > 0;
  const tieneSubtareas = hijos.length > 0;
  if (cuelgaDeUnaHistoria) console.log(`  padre:     #${padres.join(", #")}`);
  if (tieneSubtareas) console.log(`  hijos:     #${hijos.join(", #")}`);
  return Result.ok(undefined);
}
