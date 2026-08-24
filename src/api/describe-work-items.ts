import { Result } from "@skapxd/result";

import type { AdoError } from "@/errors/ado-error.js";
import { readValues } from "./read-values.js";
import { requestAdo } from "./request-ado.js";

/** Imprime en una línea por work item: id, tipo, estado y título. */
export async function describeWorkItems(
  orgUrl: string,
  ids: readonly number[],
): Promise<Result<void, AdoError>> {
  const sinResultados = ids.length === 0;
  if (sinResultados) {
    console.log("(ninguno)");
    return Result.ok(undefined);
  }

  const detalle = await requestAdo(
    `${orgUrl}/_apis/wit/workitems?ids=${ids.join(",")}&api-version=7.0`,
  );
  if (Result.isErr(detalle)) return detalle;

  for (const item of readValues(detalle.value)) {
    const campos = item["fields"] as Record<string, unknown>;
    console.log(
      `#${String(item["id"])}  [${String(campos["System.WorkItemType"])}]  ` +
        `${String(campos["System.State"])}  ${String(campos["System.Title"])}`,
    );
  }
  return Result.ok(undefined);
}
