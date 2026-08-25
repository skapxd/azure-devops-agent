import type { Formato } from "@/format/formato";

/**
 * ## formatoPorDefecto
 *
 * Elige el formato según quién va a leer la salida.
 *
 * Cuando la salida va a una terminal interactiva la lee una persona, y ahí el
 * markdown estorba: nadie renderiza los `**` ni los backticks, así que solo
 * añaden ruido. Cuando va a una tubería o a un archivo la consume un programa
 * —un agente de código, casi siempre— y entonces la estructura de markdown es
 * justo lo que ayuda a interpretarla.
 *
 * `--format` explícito manda sobre esto.
 *
 * ```ts
 * formatoPorDefecto(true);  // "text"     — se está mirando en la terminal
 * formatoPorDefecto(false); // "markdown" — va a un pipe o a un agente
 * ```
 */
export function formatoPorDefecto(esTerminalInteractiva: boolean): Formato {
  if (esTerminalInteractiva) return "text";
  return "markdown";
}
