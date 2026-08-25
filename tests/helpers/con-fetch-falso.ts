import { Result, trySafe } from "@skapxd/result";

/**
 * ## conFetchFalso
 *
 * Sustituye el `fetch` global por uno que responde lo que se le indique, y lo
 * restaura al terminar.
 *
 * Permite probar los caminos que llegan a la API —códigos de error, forma de la
 * respuesta, cuerpo que se envía— sin red, sin token y sin depender de que una
 * organización real esté disponible.
 *
 * Devuelve las llamadas capturadas para poder afirmar sobre la petición, no solo
 * sobre lo que se imprime.
 */
export interface LlamadaCapturada {
  readonly url: string;
  readonly metodo: string;
  readonly cuerpo: unknown;
  readonly autorizacion: string | null;
}

export async function conFetchFalso(
  responder: (url: string) => { estado: number; json: unknown },
  ejecutar: () => Promise<void> | void,
): Promise<readonly LlamadaCapturada[]> {
  const original = globalThis.fetch;
  const llamadas: LlamadaCapturada[] = [];

  globalThis.fetch = ((url: string | URL, init?: RequestInit) => {
    const direccion = String(url);
    const cabeceras = (init?.headers ?? {}) as Record<string, string>;
    llamadas.push({
      url: direccion,
      metodo: init?.method ?? "GET",
      cuerpo: init?.body === undefined ? null : JSON.parse(String(init.body)),
      autorizacion: cabeceras["Authorization"] ?? null,
    });

    const { estado, json } = responder(direccion);
    return Promise.resolve(
      new Response(JSON.stringify(json), {
        status: estado,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }) as typeof fetch;

  // trySafe en vez de try/finally: el fetch global se restaura pase lo que pase,
  // y un fallo de la prueba se relanza tal cual para que se vea.
  const ejecucion = await trySafe(async () => ejecutar());
  globalThis.fetch = original;
  if (Result.isErr(ejecucion)) throw ejecucion.error;

  return llamadas;
}
