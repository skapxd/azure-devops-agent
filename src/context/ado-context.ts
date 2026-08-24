/** Coordenadas de Azure DevOps derivadas del repositorio actual. */
export interface AdoContext {
  readonly org: string;
  readonly project: string;
  readonly repo: string;
  readonly orgUrl: string;
}
