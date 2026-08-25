import { Result } from "@skapxd/result";

import type { CliError } from "@/errors/cli-error";
import type { RepoCoordinates } from "@/repo/repo-coordinates";
import { getRemoteUrl } from "@/repo/get-remote-url";
import { parseRemote } from "@/repo/parse-remote";

/**
 * ## locateRepo
 *
 * Averigua dónde vive el repositorio actual dentro de Azure DevOps.
 *
 * Es el primer paso de casi todos los comandos: sin saber la organización y el
 * proyecto no se puede llamar a nada. Falla con un error de dominio si no hay
 * repositorio o si su remote apunta a otro servicio.
 *
 * ```ts
 * locateRepo(); // Ok({ org, project, repo, orgUrl }) | Err({ type: "sin-repo" })
 * ```
 */
export function locateRepo(): Result<RepoCoordinates, CliError> {
  const url = getRemoteUrl();
  const sinRepoGit = url === null;
  if (sinRepoGit) return Result.err({ type: "sin-repo" });

  const coordenadas = parseRemote(url);
  const remoteDeOtroServicio = coordenadas === null;
  if (remoteDeOtroServicio) return Result.err({ type: "remote-no-azure-devops", url });

  return Result.ok(coordenadas);
}
