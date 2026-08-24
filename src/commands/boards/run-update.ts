import { Result } from "@skapxd/result";

import type { OperacionPatch } from "@/api/send-ado.js";
import { sendAdo } from "@/api/send-ado.js";
import { resolveContext } from "@/context/resolve-context.js";
import type { AdoError } from "@/errors/ado-error.js";
import type { UpdateOptions } from "./update-options.js";

/**
 * ## runUpdate
 *
 * Cambia estado, responsable o añade un comentario a un work item.
 *
 * ```ts
 * await runUpdate({ id: "11603", state: "In Progress" });
 * // #11603 actualizado
 * ```
 */
export async function runUpdate(
  opciones: UpdateOptions,
): Promise<Result<void, AdoError>> {
  const sinId = !opciones.id;
  if (sinId) return Result.err({ type: "uso", detalle: "falta el id del work item" });

  const operaciones: OperacionPatch[] = [];
  if (opciones.state) {
    operaciones.push({ op: "add", path: "/fields/System.State", value: opciones.state });
  }
  if (opciones.assign) {
    operaciones.push({
      op: "add",
      path: "/fields/System.AssignedTo",
      value: opciones.assign,
    });
  }
  if (opciones.comment) {
    operaciones.push({
      op: "add",
      path: "/fields/System.History",
      value: opciones.comment,
    });
  }

  const nadaQueCambiar = operaciones.length === 0;
  if (nadaQueCambiar) {
    return Result.err({
      type: "uso",
      detalle: "indica al menos --state, --assign o --comment",
    });
  }

  const contexto = resolveContext();
  if (Result.isErr(contexto)) return contexto;
  const ctx = contexto.value;

  const actualizado = await sendAdo(
    `${ctx.orgUrl}/_apis/wit/workitems/${encodeURIComponent(opciones.id)}?api-version=7.0`,
    operaciones,
    "PATCH",
  );
  if (Result.isErr(actualizado)) return actualizado;

  console.log(`#${opciones.id} actualizado`);
  return Result.ok(undefined);
}
