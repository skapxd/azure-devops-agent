import { Result, trySafe } from "@skapxd/result";

import { loadPat } from "@/auth/load-pat";
import type { CliError } from "@/errors/cli-error";

const NO_AUTORIZADO = 401;
/** Azure DevOps responde 203 con el HTML de login cuando el token no sirve. */
const REDIRIGIDO_A_LOGIN = 203;

/**
 * ## fetchJson
 *
 * Lee de la API de Azure DevOps y devuelve el JSON ya parseado.
 *
 * El token solo viaja en la cabecera Authorization: nunca por argumentos (argv
 * es visible para cualquier proceso), nunca a disco y nunca a la salida.
 *
 * ```ts
 * const r = await fetchJson(`${orgUrl}/_apis/wit/workitems/11603?api-version=7.0`);
 * // Ok(<work item>) | Err({ type: "token-invalido" })
 * ```
 */
export async function fetchJson(url: string): Promise<Result<unknown, CliError>> {
  const pat = loadPat();
  const sinToken = pat === null;
  if (sinToken) return Result.err({ type: "sin-token" });

  const auth = Buffer.from(`:${pat}`).toString("base64");
  const peticion = await trySafe(async () =>
    fetch(url, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
    }),
  );

  const redFallo = Result.isErr(peticion);
  if (redFallo) return Result.err({ type: "api", status: 0 });

  const respuesta = peticion.value;
  const tokenRechazado =
    respuesta.status === NO_AUTORIZADO || respuesta.status === REDIRIGIDO_A_LOGIN;
  if (tokenRechazado) return Result.err({ type: "token-invalido" });

  if (!respuesta.ok) return Result.err({ type: "api", status: respuesta.status });

  const cuerpo = await trySafe(async () => respuesta.text());
  const noSePudoLeer = Result.isErr(cuerpo);
  if (noSePudoLeer) return Result.err({ type: "respuesta-no-json" });

  const json = trySafe(() => JSON.parse(cuerpo.value) as unknown);
  const noEraJson = Result.isErr(json);
  if (noEraJson) return Result.err({ type: "respuesta-no-json" });

  return Result.ok(json.value);
}
