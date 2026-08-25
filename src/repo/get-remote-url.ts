import { execFileSync } from "node:child_process";

import { Result, trySafe } from "@skapxd/result";

/**
 * URL del remote 'origin' del repositorio actual.
 *
 * Se lanza con execFile y lista de argumentos, nunca con una cadena que
 * interprete un shell: así no hay superficie de inyección de comandos.
 */
export function getRemoteUrl(): string | null {
  const ejecucion = trySafe(() =>
    execFileSync("git", ["remote", "get-url", "origin"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim(),
  );

  const gitFallo = Result.isErr(ejecucion);
  if (gitFallo) return null;
  return ejecucion.value;
}
