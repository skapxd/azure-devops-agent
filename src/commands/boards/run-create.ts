import { Result } from "@skapxd/result";

import type { OperacionPatch } from "@/api/send-ado.js";
import { sendAdo } from "@/api/send-ado.js";
import { resolveContext } from "@/context/resolve-context.js";
import type { AdoError } from "@/errors/ado-error.js";
import type { CreateOptions } from "./create-options.js";

/**
 * ## runCreate
 *
 * Crea un work item y, si se indica un padre, lo cuelga en la misma llamada.
 *
 * Hacerlo de una vez importa: con la API en dos pasos, un fallo entre el
 * `create` y el enlace deja un work item huérfano que nadie sabe de dónde salió.
 * Aquí, o queda completo o no queda nada.
 *
 * ```ts
 * await runCreate({ type: "Task", title: "Quitar el índice", parent: "11603" });
 * // #11607  Quitar el índice  (hijo de #11603)
 * ```
 */
export async function runCreate(
  opciones: CreateOptions,
): Promise<Result<void, AdoError>> {
  const faltanObligatorios = !opciones.type || !opciones.title;
  if (faltanObligatorios) {
    return Result.err({
      type: "uso",
      detalle: 'faltan --type y --title, p. ej. create --type Bug --title "..."',
    });
  }

  const contexto = resolveContext();
  if (Result.isErr(contexto)) return contexto;
  const ctx = contexto.value;

  const operaciones: OperacionPatch[] = [
    { op: "add", path: "/fields/System.Title", value: opciones.title },
  ];

  if (opciones.description) {
    operaciones.push({
      op: "add",
      path: "/fields/System.Description",
      value: opciones.description,
    });
  }
  if (opciones.assign) {
    operaciones.push({
      op: "add",
      path: "/fields/System.AssignedTo",
      value: opciones.assign,
    });
  }
  if (opciones.iteration) {
    operaciones.push({
      op: "add",
      path: "/fields/System.IterationPath",
      value: opciones.iteration,
    });
  }
  if (opciones.parent) {
    // Hierarchy-Reverse apunta al padre: "mi padre es este".
    operaciones.push({
      op: "add",
      path: "/relations/-",
      value: {
        rel: "System.LinkTypes.Hierarchy-Reverse",
        url: `${ctx.orgUrl}/_apis/wit/workItems/${opciones.parent}`,
      },
    });
  }

  const creado = await sendAdo(
    `${ctx.orgUrl}/${encodeURIComponent(ctx.project)}/_apis/wit/workitems/$${encodeURIComponent(opciones.type)}?api-version=7.0`,
    operaciones,
    "POST",
  );
  if (Result.isErr(creado)) return creado;

  const { id } = creado.value as { id: number };
  const colgadoDe = opciones.parent ? `  (hijo de #${opciones.parent})` : "";
  console.log(`#${String(id)}  ${opciones.title}${colgadoDe}`);
  console.log(`${ctx.orgUrl}/${ctx.project}/_workitems/edit/${String(id)}`);
  return Result.ok(undefined);
}
