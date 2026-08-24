#!/usr/bin/env node
import { Result } from "@skapxd/result";
import { Command } from "commander";

import { runCreate } from "@/commands/boards/run-create.js";
import { runIteration } from "@/commands/boards/run-iteration.js";
import { runList } from "@/commands/boards/run-list.js";
import { runOrphans } from "@/commands/boards/run-orphans.js";
import { runSearch } from "@/commands/boards/run-search.js";
import { runShow } from "@/commands/boards/run-show.js";
import { runStates } from "@/commands/boards/run-states.js";
import { runTypes } from "@/commands/boards/run-types.js";
import { runUpdate } from "@/commands/boards/run-update.js";
import { runCheck } from "@/commands/run-check.js";
import { runContext } from "@/commands/run-context.js";
import type { AdoError } from "@/errors/ado-error.js";
import { describeAdoError } from "@/errors/describe-ado-error.js";

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
 * await rendir(runTypes());   // imprime y sale con 1 si hubo error
 * ```
 */
async function rendir(
  operacion: Result<void, AdoError> | Promise<Result<void, AdoError>>,
): Promise<void> {
  const resultado = await operacion;
  const fallo = Result.isErr(resultado);
  if (!fallo) return;

  console.error(`error: ${describeAdoError(resultado.error)}`);
  process.exit(1);
}

const program = new Command();

program
  .name("ado")
  .description(
    "Azure DevOps desde la terminal.\n" +
      "Detecta organización y proyecto del git remote: no hay nada que configurar.\n\n" +
      "Autenticación: Personal Access Token en AZURE_DEVOPS_EXT_PAT. Se busca en el\n" +
      "entorno y, si no está, en ~/.zshrc, ~/.bashrc, ~/.profile, ~/.zshenv y\n" +
      "~/.bash_profile.",
  )
  .version("0.1.0");

program
  .command("context")
  .description("organización, proyecto y repositorio detectados")
  .option("--json", "salida en JSON, para encadenar con otro proceso")
  .action(async (opciones: { json?: boolean }) => {
    await rendir(runContext(opciones.json === true));
  });

program
  .command("check")
  .description("valida el token y muestra la identidad")
  .action(async () => {
    await rendir(runCheck());
  });

const boards = program
  .command("boards")
  .description("work items: crear, consultar y actualizar");

boards
  .command("types")
  .description("tipos de work item del proyecto")
  .action(async () => {
    await rendir(runTypes());
  });

boards
  .command("states")
  .argument("<tipo>", 'tipo de work item, p. ej. "Product Backlog Item"')
  .description("estados reales del workflow de ese tipo")
  .action(async (tipo: string) => {
    await rendir(runStates(tipo));
  });

boards
  .command("iteration")
  .description("ruta del sprint en curso")
  .action(async () => {
    await rendir(runIteration());
  });

boards
  .command("search")
  .argument("<texto>", "texto a buscar en el título")
  .description("busca por título, para no duplicar tickets")
  .action(async (texto: string) => {
    await rendir(runSearch(texto));
  });

boards
  .command("show")
  .argument("<id>", "id del work item")
  .description("un work item con su padre y sus hijos")
  .action(async (id: string) => {
    await rendir(runShow(id));
  });

boards
  .command("list")
  .requiredOption("--assignee <correo>", "correo de la persona")
  .description("trabajo abierto de esa persona")
  .action(async (opciones: { assignee: string }) => {
    await rendir(runList(opciones.assignee));
  });

boards
  .command("orphans")
  .description("ramas locales sin work item asociado")
  .action(async () => {
    await rendir(runOrphans());
  });

boards
  .command("create")
  .requiredOption("--type <tipo>", 'tipo de work item, p. ej. Task o Bug')
  .requiredOption("--title <texto>", "título; se lee en una lista de cientos")
  .option("--description <html>", "descripción; se renderiza como HTML")
  .option("--parent <id>", "cuelga el work item de esa historia, en la misma llamada")
  .option("--assign <correo>", "responsable")
  .option("--iteration <ruta>", "sprint; sin esto cae al backlog")
  .description("crea un work item, opcionalmente colgado de su padre")
  .action(
    async (opciones: {
      type: string;
      title: string;
      description?: string;
      parent?: string;
      assign?: string;
      iteration?: string;
    }) => {
      await rendir(runCreate(opciones));
    },
  );

boards
  .command("update")
  .argument("<id>", "id del work item")
  .option("--state <estado>", "estado; debe existir en el workflow del tipo")
  .option("--assign <correo>", "responsable")
  .option("--comment <texto>", "comentario en la discusión")
  .description("cambia estado, responsable o añade un comentario")
  .action(
    async (
      id: string,
      opciones: { state?: string; assign?: string; comment?: string },
    ) => {
      await rendir(runUpdate({ id, ...opciones }));
    },
  );

await program.parseAsync();
