import { Result, trySafe } from "@skapxd/result";

/**
 * ## conToken
 *
 * Envuelve una prueba para que corra con un token de mentira en el entorno, y
 * lo retira al terminar.
 *
 * El token nunca sale del entorno hacia la red porque `fetch` está sustituido;
 * sirve solo para que el comando pase la comprobación de credenciales.
 */
export function conToken(ejecutar: () => Promise<void>): () => Promise<void> {
  return async () => {
    process.env["AZURE_DEVOPS_EXT_PAT"] = "token-de-prueba";
    const ejecucion = await trySafe(async () => ejecutar());
    delete process.env["AZURE_DEVOPS_EXT_PAT"];
    if (Result.isErr(ejecucion)) throw ejecucion.error;
  };
}
