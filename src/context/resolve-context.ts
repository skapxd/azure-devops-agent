import { Result } from "@skapxd/result";

import type { AdoError } from "@/errors/ado-error.js";
import type { AdoContext } from "./ado-context.js";
import { getRemoteUrl } from "./get-remote-url.js";
import { parseRemote } from "./parse-remote.js";

/** Deriva el contexto de Azure DevOps del repositorio actual. */
export function resolveContext(): Result<AdoContext, AdoError> {
  const url = getRemoteUrl();
  const sinRepoGit = url === null;
  if (sinRepoGit) return Result.err({ type: "sin-repo" });

  const contexto = parseRemote(url);
  const remoteDeOtroServicio = contexto === null;
  if (remoteDeOtroServicio) return Result.err({ type: "remote-no-ado", url });

  return Result.ok(contexto);
}
