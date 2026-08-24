/** Cambios aplicables a un work item existente. */
export interface UpdateOptions {
  readonly id: string;
  readonly state?: string;
  readonly assign?: string;
  readonly comment?: string;
}
