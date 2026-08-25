/**
 * Respuestas simuladas para el flujo de etiquetado.
 *
 * `runTag` lee y luego escribe, así que las pruebas necesitan distinguir las dos
 * peticiones. La lectura se reconoce porque pide solo ese campo en la URL.
 */

interface RespuestaSimulada {
  readonly estado: number;
  readonly json: unknown;
}

const OK = 200;

export function esLecturaDeEtiquetas(url: string): boolean {
  return url.includes("fields=System.Tags");
}

/** Responde a la lectura con las etiquetas dadas; a la escritura, con éxito. */
export function conEtiquetasActuales(
  actuales: string,
): (url: string) => RespuestaSimulada {
  return (url) => {
    if (!esLecturaDeEtiquetas(url)) return { estado: OK, json: {} };
    return { estado: OK, json: { fields: { "System.Tags": actuales } } };
  };
}

/** Un lote donde 11604 aún no tiene la huella y 11605 ya la tiene. */
export function responderLoteMixto(url: string): RespuestaSimulada {
  if (!esLecturaDeEtiquetas(url)) return { estado: OK, json: {} };
  const yaEtiquetado = url.includes("11605");
  return { estado: OK, json: { fields: { "System.Tags": yaEtiquetado ? "agent" : "" } } };
}
