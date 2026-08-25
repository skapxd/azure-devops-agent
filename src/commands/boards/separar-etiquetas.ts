/**
 * ## separarEtiquetas
 *
 * Convierte el campo `System.Tags` en la lista de etiquetas que representa.
 *
 * Azure DevOps las guarda todas en un solo campo separadas por `;`, y devuelve
 * `"a; b"` con espacio — pero por API puede llegar sin él, así que se recorta
 * cada una en vez de confiar en el separador.
 *
 * ```ts
 * separarEtiquetas("qa; urgente");  // ["qa", "urgente"]
 * separarEtiquetas("");             // []
 * ```
 */
export function separarEtiquetas(campo: string): readonly string[] {
  return campo
    .split(";")
    .map((etiqueta) => etiqueta.trim())
    .filter((etiqueta) => etiqueta.length > 0);
}
