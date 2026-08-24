import { Result, trySafe } from "@skapxd/result";

import { loadPat } from "@/context/load-pat.js";
import type { AdoError } from "@/errors/ado-error.js";

const NO_AUTORIZADO = 401;
const REDIRIGIDO_A_LOGIN = 203;

/**
 * ## queryWiql
 *
 * Ejecuta una consulta WiQL y devuelve los ids que encuentra.
 *
 * El endpoint exige POST con el query en el cuerpo: mandarlo como query string
 * en un GET devuelve 405. Los campos se piden después en lote, que es como la
 * API espera que se haga.
 *
 * ```ts
 * await queryWiql(orgUrl, "MiProyecto", "SELECT [System.Id] FROM WorkItems");
 * // Ok([11603, 11604]) | Err({ type: "api", status: 405 })
 * ```
 */
export async function queryWiql(
  orgUrl: string,
  project: string,
  wiql: string,
): Promise<Result<readonly number[], AdoError>> {
  const pat = loadPat();
  const sinToken = pat === null;
  if (sinToken) return Result.err({ type: "sin-token" });

  const auth = Buffer.from(`:${pat}`).toString("base64");
  const peticion = await trySafe(async () =>
    fetch(`${orgUrl}/${encodeURIComponent(project)}/_apis/wit/wiql?api-version=7.0`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: wiql }),
    }),
  );

  const redFallo = Result.isErr(peticion);
  if (redFallo) return Result.err({ type: "api", status: 0 });

  const respuesta = peticion.value;
  const tokenRechazado =
    respuesta.status === NO_AUTORIZADO || respuesta.status === REDIRIGIDO_A_LOGIN;
  if (tokenRechazado) return Result.err({ type: "token-invalido" });

  if (!respuesta.ok) return Result.err({ type: "api", status: respuesta.status });

  const cuerpo = await trySafe(async () => respuesta.json() as Promise<unknown>);
  const noEraJson = Result.isErr(cuerpo);
  if (noEraJson) return Result.err({ type: "respuesta-no-json" });

  const { workItems } = cuerpo.value as { workItems?: readonly { id: number }[] };
  return Result.ok((workItems ?? []).map((w) => w.id));
}
