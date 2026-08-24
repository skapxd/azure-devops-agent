import type { UpdateOptions } from "@/commands/boards/update-options.js";

/**
 * ## updateOptionsFromFlags
 *
 * Arma los cambios a aplicar a partir del id y las banderas del CLI.
 *
 * ```ts
 * updateOptionsFromFlags("11603", { state: "In Progress" });
 * // { id: "11603", state: "In Progress" }
 * ```
 */
export function updateOptionsFromFlags(
  id: string,
  flags: Readonly<Record<string, string>>,
): UpdateOptions {
  return {
    id,
    ...(flags["state"] !== undefined && { state: flags["state"] }),
    ...(flags["assign"] !== undefined && { assign: flags["assign"] }),
    ...(flags["comment"] !== undefined && { comment: flags["comment"] }),
  };
}
