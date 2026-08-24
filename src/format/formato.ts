/**
 * Formatos de salida.
 *
 * `markdown` es el predeterminado porque el consumidor principal de este CLI es
 * un agente de código, y el markdown le da estructura semántica —tablas,
 * listas, énfasis— que el texto alineado con espacios no tiene.
 */
export type Formato = "markdown" | "json" | "text";

export const FORMATOS: readonly Formato[] = ["markdown", "json", "text"];

export const FORMATO_POR_DEFECTO: Formato = "markdown";
