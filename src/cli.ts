#!/usr/bin/env node
import { Result } from "@skapxd/result";
import { Command } from "commander";

import { runCreate } from "@/commands/boards/run-create.js";
import { runOrphans } from "@/commands/boards/run-orphans.js";
import { runStates } from "@/commands/boards/run-states.js";
import { runContext } from "@/commands/run-context.js";
import type { AdoError } from "@/errors/ado-error.js";
import { describeAdoError } from "@/errors/describe-ado-error.js";
import type { Formato } from "@/format/formato.js";
import { FORMATOS, FORMATO_POR_DEFECTO } from "@/format/formato.js";
import { parseFormato } from "@/format/parse-formato.js";

/**
 * ## rendir
 *
 * Traduce el Result de un comando a la salida del proceso.
 *
 * Los comandos devuelven `Result` en vez de lanzar, así que este es el único
 * punto donde un fallo se convierte en código de salida y mensaje. Se imprime
 * solo el mensaje: nunca el token ni la cabecera de autenticación.
 *
 * ```ts
 * await rendir((f) => runOrphans(f));   // imprime y sale con 1 si hubo error
 * ```
 */
async function rendir(
  operacion: (formato: Formato) => Result<void, AdoError> | Promise<Result<void, AdoError>>,
): Promise<void> {
  const elegido = parseFormato(String(program.opts()["format"]));
  const resultado = Result.isErr(elegido) ? elegido : await operacion(elegido.value);

  const fallo = Result.isErr(resultado);
  if (!fallo) return;

  console.error(`error: ${describeAdoError(resultado.error)}`);
  process.exit(1);
}

const program = new Command();

program
  .name("ado")
  .description(
    "Lo que `az boards` no hace, para trabajar Azure DevOps desde la terminal.\n\n" +
      "Este CLI es COMPLEMENTARIO a la extensión azure-devops de Azure CLI, no un\n" +
      "reemplazo: para consultar, crear sin jerarquía o actualizar work items usa\n" +
      "`az boards`, que ya lo cubre bien. Aquí viven solo los huecos que deja.\n\n" +
      "Autenticación: Personal Access Token en AZURE_DEVOPS_EXT_PAT. Se lee del\n" +
      "entorno y, si no está ahí, del perfil de shell del sistema: en macOS y Linux\n" +
      "~/.zshrc, ~/.bashrc, ~/.profile, ~/.zshenv y ~/.bash_profile; en Windows el\n" +
      "$PROFILE de PowerShell y los perfiles de Git Bash.",
  )
  .option(
    "--format <formato>",
    `formato de salida: ${FORMATOS.join(", ")}`,
    FORMATO_POR_DEFECTO,
  )
  .version("0.1.0");

program
  .command("context")
  .description(
    "organización, proyecto, repositorio e identidad — para alimentar a `az`",
  )
  .action(async () => {
    await rendir(async (formato) => runContext(formato));
  });

const boards = program.command("boards").description("los huecos de `az boards`");

boards
  .command("states")
  .argument("<tipo>", 'tipo de work item, p. ej. "Product Backlog Item"')
  .description("estados válidos del workflow de ese tipo (az no los expone)")
  .action(async (tipo: string) => {
    await rendir(async (formato) => runStates(tipo, formato));
  });

boards
  .command("orphans")
  .description("ramas locales sin work item asociado (no existe en az)")
  .action(async () => {
    await rendir((formato) => runOrphans(formato));
  });

boards
  .command("create")
  .requiredOption("--type <tipo>", "tipo de work item, p. ej. Task o Bug")
  .requiredOption("--title <texto>", "título; se lee en una lista de cientos")
  .requiredOption("--parent <id>", "historia de la que cuelga")
  .option("--description <html>", "descripción; se renderiza como HTML")
  .option("--assign <correo>", "responsable")
  .option("--iteration <ruta>", "sprint; sin esto cae al backlog")
  .description(
    "crea un work item YA COLGADO de su padre, en una sola llamada.\n" +
      "Sin --parent usa `az boards work-item create`, que hace lo mismo.",
  )
  .action(
    async (opciones: {
      type: string;
      title: string;
      parent: string;
      description?: string;
      assign?: string;
      iteration?: string;
    }) => {
      await rendir(async (formato) => runCreate(opciones, formato));
    },
  );

await program.parseAsync();
