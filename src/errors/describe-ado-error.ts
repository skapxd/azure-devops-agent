import { match } from "ts-pattern";

import type { AdoError } from "./ado-error.js";

/** Traduce un error de dominio al mensaje que ve la persona. */
export function describeAdoError(error: AdoError): string {
  return match(error)
    .with(
      { type: "sin-repo" },
      () => "no hay remote 'origin' — ¿estás dentro de un repositorio git?",
    )
    .with(
      { type: "remote-no-ado" },
      (e) => `el remote no es de Azure DevOps: ${e.url}`,
    )
    .with(
      { type: "sin-token" },
      () =>
        "falta AZURE_DEVOPS_EXT_PAT — genera un token en\n" +
        "  https://dev.azure.com/<org>/_usersSettings/tokens\n" +
        "y expórtalo en tu perfil de shell.",
    )
    .with(
      { type: "token-invalido" },
      () => "el token no autenticó — puede estar vencido o sin permisos",
    )
    .with({ type: "api" }, (e) => `la API de Azure DevOps respondió ${e.status}`)
    .with(
      { type: "respuesta-no-json" },
      () => "la API no devolvió JSON — revisa el token y la organización",
    )
    .with({ type: "uso" }, (e) => e.detalle)
    .exhaustive();
}
