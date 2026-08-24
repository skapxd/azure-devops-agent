/** Lo que hace falta para crear un work item de una sola vez. */
export interface CreateOptions {
  readonly type: string;
  readonly title: string;
  readonly description?: string;
  readonly parent?: string;
  readonly assign?: string;
  readonly iteration?: string;
}
