/**
 * Lo que hace falta para crear un work item ya colgado de su padre.
 *
 * `parent` es obligatorio a propósito: crear sin jerarquía ya lo hace
 * `az boards work-item create`, y duplicarlo aquí no aporta nada.
 */
export interface CreateOptions {
  readonly type: string;
  readonly title: string;
  readonly parent: string;
  readonly description?: string;
  readonly assign?: string;
  readonly iteration?: string;
}
