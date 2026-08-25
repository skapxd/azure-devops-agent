/**
 * Dónde vive este repositorio dentro de Azure DevOps.
 *
 * Tres valores lo localizan —organización, proyecto y repositorio— y de ellos
 * sale cualquier llamada a la API. Se derivan del `git remote`, así que no hay
 * nada que configurar ni que pueda quedar desincronizado.
 */
export interface RepoCoordinates {
  readonly org: string;
  readonly project: string;
  readonly repo: string;
  readonly orgUrl: string;
}
