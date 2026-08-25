#!/usr/bin/env node
import { Result } from "@skapxd/result";
import { Command } from "commander";

import { runCreate } from "@/commands/boards/run-create.js";
import { runUnlinked } from "@/commands/branches/run-unlinked.js";
import { runStates } from "@/commands/boards/run-states.js";
import type { AdoError } from "@/errors/ado-error.js";
import { describeAdoError } from "@/errors/describe-ado-error.js";
import {
  EJEMPLO_CREATE,
  EJEMPLO_GENERAL,
  EJEMPLO_UNLINKED,
  EJEMPLO_STATES,
} from "@/help-examples.js";
import type { Formato } from "@/format/formato.js";
import { FORMATOS } from "@/format/formato.js";
import { formatoPorDefecto } from "@/format/formato-por-defecto.js";
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
 * await rendir((f) => runUnlinked(f));   // imprime y sale con 1 si hubo error
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
  .name("npx @skapxd/azure-devops-agent")
  .description(
    "Tres cosas que `az boards` no hace.\n\n" +
      "Este CLI es COMPLEMENTARIO a la extensión azure-devops de Azure CLI, no un\n" +
      "reemplazo. `az` detecta solo la organización y el proyecto desde el git\n" +
      "remote, y cubre bien consultar, actualizar y crear sin jerarquía: úsalo para\n" +
      "todo eso. Aquí viven solo los huecos que deja.\n\n" +
      "Autenticación: Personal Access Token en AZURE_DEVOPS_EXT_PAT. Se lee del\n" +
      "entorno y, si no está ahí, del perfil de shell del sistema: en macOS y Linux\n" +
      "~/.zshrc, ~/.bashrc, ~/.profile, ~/.zshenv y ~/.bash_profile; en Windows el\n" +
      "$PROFILE de PowerShell y los perfiles de Git Bash.",
  )
  .option(
    "--format <formato>",
    `formato de salida: ${FORMATOS.join(", ")}\n` +
      "(por defecto: text en la terminal, markdown al redirigir a otro proceso)",
    formatoPorDefecto(process.stdout.isTTY === true),
  )
  .version("0.1.0")
  .addHelpText("after", EJEMPLO_GENERAL);

const boards = program.command("boards").description("lo que az boards no cubre");

boards
  .command("states")
  .argument("<tipo>", 'nombre exacto del tipo, p. ej. "Product Backlog Item"')
  .description("los estados por los que puede pasar un work item de ese tipo")
  .addHelpText("after", EJEMPLO_STATES)
  .action(async (tipo: string) => {
    await rendir(async (formato) => runStates(tipo, formato));
  });

boards
  .command("create")
  .requiredOption("--type <tipo>", "Task, Bug… (ver: az boards work-item type list)")
  .requiredOption("--title <texto>", "qué pasa, no dónde: se lee en una lista de cientos")
  .requiredOption("--parent <id>", "id de la historia de la que cuelga, p. ej. 11603")
  .option("--description <html>", "por qué importa y qué se rompe si no se hace (HTML)")
  .option("--assign <correo>", "responsable, por correo")
  .option("--iteration <ruta>", "sprint (az boards iteration project list); sin esto va al backlog")
  .description("crea una tarea ya colgada de su historia, en una sola llamada")
  .addHelpText("after", EJEMPLO_CREATE)
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

const branches = program
  .command("branches")
  .description("relación entre tus ramas de git y el tablero");

branches
  .command("unlinked")
  .description("qué ramas tuyas no referencian ningún work item")
  .addHelpText("after", EJEMPLO_UNLINKED)
  .action(async () => {
    await rendir((formato) => runUnlinked(formato));
  });

await program.parseAsync();
