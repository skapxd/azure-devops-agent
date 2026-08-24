/** Reconoce un número de work item en el nombre de la rama, en cualquier posición. */
const NUMERO_EN_RAMA = /(?:^|[/_-])(\d{2,})(?:[/_-]|$)/;

/**
 * ## filtrarRamasSinWorkItem
 *
 * De la salida de `git branch`, deja solo las ramas que no referencian ningún
 * work item.
 *
 * ```ts
 * filtrarRamasSinWorkItem("feat/1234-algo\nback/n-a/otra\n");
 * // ["back/n-a/otra"]
 * ```
 */
export function filtrarRamasSinWorkItem(salidaDeGit: string): readonly string[] {
  return salidaDeGit
    .split("\n")
    .map((rama) => rama.trim())
    .filter((rama) => rama.length > 0 && !NUMERO_EN_RAMA.test(rama));
}
