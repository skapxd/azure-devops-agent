interface RespuestaConValores {
  readonly value?: readonly Record<string, unknown>[];
}

/**
 * Acota una respuesta de la API a la forma `{ value: [...] }` que devuelven los
 * endpoints de listado. Si no la tiene, devuelve una lista vacía en vez de
 * romper: para quien llama, "no hay resultados" y "forma inesperada" se tratan
 * igual.
 */
export function readValues(respuesta: unknown): readonly Record<string, unknown>[] {
  const valores = (respuesta as RespuestaConValores | null)?.value;
  const esLista = Array.isArray(valores);
  if (!esLista) return [];
  return valores;
}
