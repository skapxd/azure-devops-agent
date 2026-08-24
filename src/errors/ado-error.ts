/**
 * Errores de dominio del CLI.
 *
 * Se modelan como unión discriminada para que `match()` obligue a cubrir cada
 * variante: si mañana se añade una, el compilador señala dónde falta tratarla.
 */
export type AdoError =
  | { readonly type: "sin-repo" }
  | { readonly type: "remote-no-ado"; readonly url: string }
  | { readonly type: "sin-token" }
  | { readonly type: "token-invalido" }
  | { readonly type: "api"; readonly status: number }
  | { readonly type: "respuesta-no-json" }
  | { readonly type: "uso"; readonly detalle: string };
