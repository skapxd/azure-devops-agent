/**
 * Todo lo que puede salir mal en este CLI.
 *
 * No son solo errores de Azure DevOps: `sin-repo`, `uso` y
 * `remote-no-azure-devops` ocurren antes de tocar la red. De ahí el nombre — lo
 * que tienen en común es el programa, no el servicio.
 *
 * Se modelan como unión discriminada para que `match()` obligue a cubrir cada
 * variante: si mañana se añade una, el compilador señala dónde falta tratarla.
 */
export type CliError =
  | { readonly type: "sin-repo" }
  | { readonly type: "remote-no-azure-devops"; readonly url: string }
  | { readonly type: "sin-token" }
  | { readonly type: "token-invalido" }
  | { readonly type: "api"; readonly status: number }
  | { readonly type: "respuesta-no-json" }
  | { readonly type: "uso"; readonly detalle: string };
