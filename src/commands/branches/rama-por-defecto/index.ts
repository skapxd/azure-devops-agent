import { execFileSync } from "node:child_process";

import { Result, trySafe } from "@skapxd/result";

/**
 * ## ramaPorDefecto
 *
 * Rama principal del remote, p. ej. `main` o `dev`.
 *
 * Se consulta en vez de asumir `main` porque muchos equipos integran en otra
 * —aquí hay repos cuya principal es `dev`— y darla por huérfana sería el
 * primer falso positivo que ve el usuario.
 *
 * Devuelve cadena vacía si el repo no la tiene definida; entonces solo actúa la
 * lista de nombres conocidos.
 *
 * ```ts
 * ramaPorDefecto(); // "main"
 * ```
 */
export function ramaPorDefecto(): string {
  const referencia = trySafe(() =>
    execFileSync("git", ["symbolic-ref", "refs/remotes/origin/HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim(),
  );

  const noEstaDefinida = Result.isErr(referencia);
  if (noEstaDefinida) return "";
  return referencia.value.replace("refs/remotes/origin/", "");
}
