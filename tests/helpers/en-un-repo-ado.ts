import { Result, trySafe } from "@skapxd/result";

import { repoDePrueba } from "./repo-de-prueba.js";
import { sinRuido } from "./sin-ruido.js";

/**
 * ## enUnRepoAdo
 *
 * Ejecuta algo dentro de un repositorio con remote de Azure DevOps y con un
 * token de mentira en el entorno.
 *
 * Hace falta porque los comandos derivan la organización y el proyecto del
 * `git remote` del directorio actual: sin esto leerían el del propio proyecto,
 * que apunta a GitHub.
 */
export async function enUnRepoAdo(ejecutar: () => Promise<void>): Promise<void> {
  const repo = repoDePrueba(["main"], "git@ssh.dev.azure.com:v3/MiOrg/MiProy/MiRepo");
  const cwdOriginal = process.cwd();
  process.chdir(repo.ruta);
  process.env["AZURE_DEVOPS_EXT_PAT"] = "token-de-prueba";

  const ejecucion = await trySafe(async () => sinRuido(ejecutar));

  delete process.env["AZURE_DEVOPS_EXT_PAT"];
  process.chdir(cwdOriginal);
  repo.limpiar();
  if (Result.isErr(ejecucion)) throw ejecucion.error;
}
