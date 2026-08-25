import { Result } from "@skapxd/result";

import type { OperacionPatch } from "@/api/send-patch.js";
import { sendPatch } from "@/api/send-patch.js";
import { locateRepo } from "@/repo/locate-repo.js";
import type { CliError } from "@/errors/cli-error.js";
import type { Formato } from "@/format/formato.js";
import { renderWorkItemCreado } from "@/commands/boards/render-work-item-creado.js";
import type { CreateOptions } from "@/commands/boards/create-options.js";

/**
 * ## runCreate
 *
 * Crea un work item ya colgado de su padre, en una sola llamada.
 *
 * Es el hueco que deja `az`: allí son dos comandos —`work-item create` y
 * `relation add`— y un fallo entre ambos deja un work item huérfano que nadie
 * sabe de dónde salió. Aquí, o queda completo o no queda nada.
 *
 * ```ts
 * await runCreate({ type: "Task", title: "Quitar el índice", parent: "11603" });
 * // #11607  Quitar el índice  (hijo de #11603)
 * ```
 */
export async function runCreate(
  opciones: CreateOptions,
  formato: Formato,
): Promise<Result<void, CliError>> {
  const repo = locateRepo();
  if (Result.isErr(repo)) return repo;
  const ctx = repo.value;

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
  // Hierarchy-Reverse apunta al padre: "mi padre es este".
  operaciones.push({
    op: "add",
    path: "/relations/-",
    value: {
      rel: "System.LinkTypes.Hierarchy-Reverse",
      url: `${ctx.orgUrl}/_apis/wit/workItems/${opciones.parent}`,
    },
  });

  const creado = await sendPatch(
    `${ctx.orgUrl}/${encodeURIComponent(ctx.project)}/_apis/wit/workitems/$${encodeURIComponent(opciones.type)}?api-version=7.0`,
    operaciones,
    "POST",
  );
  if (Result.isErr(creado)) return creado;

  const { id } = creado.value as { id: number };
  console.log(
    renderWorkItemCreado(
      {
        id,
        title: opciones.title,
        parent: opciones.parent,
        url: `${ctx.orgUrl}/${ctx.project}/_workitems/edit/${String(id)}`,
      },
      formato,
    ),
  );
  return Result.ok(undefined);
}
