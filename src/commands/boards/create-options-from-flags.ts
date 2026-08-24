import type { CreateOptions } from "@/commands/boards/create-options.js";

/**
 * ## createOptionsFromFlags
 *
 * Arma las opciones de creación a partir de las banderas del CLI.
 *
 * Los campos opcionales se omiten en vez de mandarse vacíos: con
 * `exactOptionalPropertyTypes`, un `undefined` explícito no es lo mismo que
 * ausente, y la API rechazaría un campo presente sin valor.
 *
 * ```ts
 * createOptionsFromFlags({ type: "Task", title: "x", parent: "11603" });
 * // { type: "Task", title: "x", parent: "11603" }
 * ```
 */
export function createOptionsFromFlags(
  flags: Readonly<Record<string, string>>,
): CreateOptions {
  return {
    type: flags["type"] ?? "",
    title: flags["title"] ?? "",
    ...(flags["description"] !== undefined && { description: flags["description"] }),
    ...(flags["parent"] !== undefined && { parent: flags["parent"] }),
    ...(flags["assign"] !== undefined && { assign: flags["assign"] }),
    ...(flags["iteration"] !== undefined && { iteration: flags["iteration"] }),
  };
}
