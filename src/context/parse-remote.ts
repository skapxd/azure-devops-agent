import { Result, trySafe } from "@skapxd/result";

import type { AdoContext } from "./ado-context.js";

/**
 * Identificadores admitidos en un segmento, ya decodificado.
 *
 * Se comprueba después de decodificar a propósito: si se validara el texto
 * crudo, un `%3B` pasaría el filtro y se convertiría en `;` al decodificar.
 *
 * Acepta letras y números Unicode porque los proyectos se llaman como se llaman
 * —"Onboarding de Préstamos de Vivienda"— y rechazarlos por llevar tilde sería
 * rechazar la mitad de los proyectos reales. Lo que no entra es lo que rompería
 * la ruta o permitiría salirse de ella: barras, dos puntos y metacaracteres.
 */
const SEGMENTO_VALIDO = /^[\p{L}\p{N}._~-][\p{L}\p{N}._~\s-]*$/u;

/** Los formatos de remote de Azure DevOps, cada uno con los datos en otro sitio. */
const PATRONES: readonly RegExp[] = [
  // git@ssh.dev.azure.com:v3/<org>/<proyecto>/<repo>
  /^(?:[^@]+@)?ssh\.dev\.azure\.com:v3\/([^/]+)\/([^/]+)\/(.+)$/,
  // <org>@vs-ssh.visualstudio.com:v3/<org>/<proyecto>/<repo>   (SSH del dominio antiguo)
  /^(?:[^@]+@)?vs-ssh\.visualstudio\.com:v3\/([^/]+)\/([^/]+)\/(.+)$/,
  // https://<algo>@dev.azure.com/<org>/<proyecto>/_git/<repo>
  /^https?:\/\/(?:[^@/]+@)?dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/(.+)$/,
  // https://<org>.visualstudio.com/<proyecto>/_git/<repo>   (formato antiguo)
  /^https?:\/\/([^.]+)\.visualstudio\.com\/([^/]+)\/_git\/(.+)$/,
];

/**
 * Extrae organización, proyecto y repositorio de la URL de un remote.
 *
 * Los segmentos vienen percent-encoded: un proyecto llamado "Onboarding de
 * Préstamos" aparece en el remote como "Onboarding%20de%20Pr%C3%A9stamos". Se
 * decodifican aquí para devolver el nombre real —el que espera `az --project` y
 * el que lee una persona—, y quien construya una URL vuelve a codificarlo. Sin
 * esta decodificación se produce doble encoding (`%20` pasa a `%2520`) y la API
 * responde 404.
 *
 * La URL es entrada no confiable —la controla quien configuró el repo— y de
 * ella salen valores que acaban dentro de una URL, así que cada segmento se
 * valida ya decodificado antes de darlo por bueno.
 */
export function parseRemote(url: string): AdoContext | null {
  const limpia = url.trim().replace(/\.git$/, "");

  for (const patron of PATRONES) {
    const coincidencia = limpia.match(patron);
    const noCoincide = coincidencia === null;
    if (noCoincide) continue;

    const crudos = [coincidencia[1], coincidencia[2], coincidencia[3]];
    const faltaAlgunSegmento = crudos.some((segmento) => !segmento);
    if (faltaAlgunSegmento) continue;

    // Un percent-encoding malformado (p. ej. "%zz") hace saltar decodeURIComponent.
    const decodificados = trySafe(() =>
      crudos.map((segmento) => decodeURIComponent(segmento ?? "")),
    );
    const encodingInvalido = Result.isErr(decodificados);
    if (encodingInvalido) return null;

    const [org, project, repo] = decodificados.value;
    if (!org || !project || !repo) continue;

    const segmentosSonSeguros = [org, project, repo].every((segmento) =>
      SEGMENTO_VALIDO.test(segmento),
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
