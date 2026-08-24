/**
 * ## idDeUrl
 *
 * Saca el id de work item del final de una URL de relación de Azure DevOps.
 *
 * ```ts
 * idDeUrl("https://dev.azure.com/org/_apis/wit/workItems/11603"); // "11603"
 * idDeUrl("");                                                    // "?"
 * ```
 */
export function idDeUrl(url: string): string {
  return url.split("/").at(-1) ?? "?";
}
