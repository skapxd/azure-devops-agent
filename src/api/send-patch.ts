import { Result, trySafe } from "@skapxd/result";

import { loadPat } from "@/auth/load-pat.js";
import type { CliError } from "@/errors/cli-error.js";

const NO_AUTORIZADO = 401;
const REDIRIGIDO_A_LOGIN = 203;

/** Operación del formato JSON Patch que espera la API de work items. */
export interface OperacionPatch {
  readonly op: "add" | "replace";
  readonly path: string;
  readonly value: unknown;
}

/**
 * ## sendPatch
 *
 * Escribe en la API de Azure DevOps con el formato JSON Patch que exige.
 *
 * Los work items se crean y modifican con `application/json-patch+json`: el
 * cuerpo es una lista de operaciones, no un objeto. Eso permite fijar campos y
 * enlazar el padre en la misma llamada.
 *
 * ```ts
 * await sendPatch(url, [{ op: "add", path: "/fields/System.Title", value: "x" }], "POST");
 * // Ok({ id: 11603 }) | Err({ type: "api", status: 400 })
 * ```
 */
export async function sendPatch(
  url: string,
  operaciones: readonly OperacionPatch[],
  metodo: "POST" | "PATCH",
): Promise<Result<unknown, CliError>> {
  const pat = loadPat();
  const sinToken = pat === null;
  if (sinToken) return Result.err({ type: "sin-token" });

  const auth = Buffer.from(`:${pat}`).toString("base64");
  const peticion = await trySafe(async () =>
    fetch(url, {
      method: metodo,
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json-patch+json",
      },
      body: JSON.stringify(operaciones),
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
