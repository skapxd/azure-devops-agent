#!/usr/bin/env node
import { Command } from "commander";

import { runCreate } from "@/commands/boards/run-create.js";
import { runUnlinked } from "@/commands/branches/run-unlinked.js";
import { runStates } from "@/commands/boards/run-states.js";
import {
  EJEMPLO_CREATE,
  EJEMPLO_GENERAL,
  EJEMPLO_UNLINKED,
  EJEMPLO_STATES,
} from "@/help-examples.js";
import { FORMATOS } from "@/format/formato.js";
import { formatoPorDefecto } from "@/format/formato-por-defecto.js";
import { rendir } from "@/rendir.js";

const program = new Command();

/** Lo que el usuario pidió en --format, sin validar todavía. */
const formatoElegido = (): string => String(program.opts()["format"]);

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
    await rendir((formato) => runStates(tipo, formato), formatoElegido());
  });

boards
  .command("create")
  .requiredOption("--type <tipo>", "Task, Bug… (ver: az boards work-item type list)")
  .requiredOption("--title <texto>", "qué pasa, no dónde: se lee en una lista de cientos")
  .requiredOption("--parent <id>", "id del work item padre, p. ej. 11603")
  .option("--description <html>", "por qué importa y qué se rompe si no se hace (HTML)")
  .option("--assign <correo>", "responsable, por correo")
  .option("--iteration <ruta>", "sprint (az boards iteration project list); sin esto va al backlog")
  .description("crea un work item ya colgado de su padre, en una sola llamada")
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
      await rendir((formato) => runCreate(opciones, formato), formatoElegido());
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
    await rendir((formato) => runUnlinked(formato), formatoElegido());
  });

await program.parseAsync();
