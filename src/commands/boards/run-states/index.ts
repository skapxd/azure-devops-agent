import { Result } from "@skapxd/result";

import { readValues } from "@/api/read-values";
import { fetchJson } from "@/api/fetch-json";
import { locateRepo } from "@/repo/locate-repo";
import type { CliError } from "@/errors/cli-error";
import type { Formato } from "@/format/formato";
import { renderEstados } from "@/commands/boards/render-estados";

/**
 * ## runStates
 *
 * Estados reales del workflow de un tipo de work item.
 *
 * `az` no los expone, y casi todos los proyectos los tienen personalizados: usar
 * un estado que no existe falla, y usar uno que existe pero significa otra cosa
 * desordena el tablero de todos.
 *
 * ```bash
 * npx @skapxd/azure-devops-agent boards states "Product Backlog Item"
 * ```
 */
export async function runStates(
  tipo: string,
  formato: Formato,
): Promise<Result<void, CliError>> {
  const repo = locateRepo();
  if (Result.isErr(repo)) return repo;
  const ctx = repo.value;

  const respuesta = await fetchJson(
    `${ctx.orgUrl}/${encodeURIComponent(ctx.project)}/_apis/wit/workitemtypes/${encodeURIComponent(tipo)}/states?api-version=7.0`,
  );
  if (Result.isErr(respuesta)) return respuesta;

  const estados = readValues(respuesta.value).map((estado) => String(estado["name"]));
  console.log(renderEstados(tipo, estados, formato));
  return Result.ok(undefined);
}
