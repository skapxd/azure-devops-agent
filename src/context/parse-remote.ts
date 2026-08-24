import type { AdoContext } from "./ado-context.js";

/** Identificadores admitidos en un segmento de URL de Azure DevOps. */
const SEGMENTO_VALIDO = /^[A-Za-z0-9._~-][A-Za-z0-9._~%\s-]*$/;

/** Los tres formatos de remote de Azure DevOps; cada uno coloca los datos en otro sitio. */
const PATRONES: readonly RegExp[] = [
  // git@ssh.dev.azure.com:v3/<org>/<proyecto>/<repo>
  /^(?:[^@]+@)?ssh\.dev\.azure\.com:v3\/([^/]+)\/([^/]+)\/(.+)$/,
  // https://<algo>@dev.azure.com/<org>/<proyecto>/_git/<repo>
  /^https?:\/\/(?:[^@/]+@)?dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/(.+)$/,
  // https://<org>.visualstudio.com/<proyecto>/_git/<repo>   (formato antiguo)
  /^https?:\/\/([^.]+)\.visualstudio\.com\/([^/]+)\/_git\/(.+)$/,
];

/**
 * Extrae organización, proyecto y repositorio de la URL de un remote.
 *
 * La URL es entrada no confiable —la controla quien configuró el repo— y de
 * ella salen valores que acaban dentro de una URL, así que cada segmento se
 * valida antes de darlo por bueno.
 */
export function parseRemote(url: string): AdoContext | null {
  const limpia = url.trim().replace(/\.git$/, "");

  for (const patron of PATRONES) {
    const coincidencia = limpia.match(patron);
    const noCoincide = coincidencia === null;
    if (noCoincide) continue;

    const [, org, project, repo] = coincidencia;
    const faltaAlgunSegmento = !org || !project || !repo;
    if (faltaAlgunSegmento) continue;

    const segmentosSonSeguros = [org, project, repo].every((s) =>
      SEGMENTO_VALIDO.test(s),
    );
    if (!segmentosSonSeguros) return null;

    return {
      org,
      project,
      repo,
      orgUrl: `https://dev.azure.com/${encodeURIComponent(org)}`,
    };
  }
  return null;
}
