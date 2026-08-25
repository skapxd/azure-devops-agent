interface RespuestaWorkItem {
  readonly fields?: Record<string, unknown>;
}

/**
 * ## leerCampoDeEtiquetas
 *
 * Saca `System.Tags` de un work item devuelto por la API.
 *
 * Un work item sin etiquetas no trae el campo vacío: no trae el campo. Aquí las
 * dos situaciones colapsan en la cadena vacía, que es como se comporta el resto
 * del flujo.
 */
export function leerCampoDeEtiquetas(respuesta: unknown): string {
  const campo = (respuesta as RespuestaWorkItem | null)?.fields?.["System.Tags"];
  return typeof campo === "string" ? campo : "";
}
