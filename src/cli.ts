#!/usr/bin/env node
import { createRequire } from "node:module";

import { Command } from "commander";

import { acumularOpcionRepetible } from "@/acumular-opcion-repetible";
import { ETIQUETA_AGENTE } from "@/commands/boards/etiqueta-agente";
import { runCreate } from "@/commands/boards/run-create";
import { runTag } from "@/commands/boards/run-tag";
import { runUnlinked } from "@/commands/branches/run-unlinked";
import { runStates } from "@/commands/boards/run-states";
import {
  EJEMPLO_CREATE,
  EJEMPLO_GENERAL,
  EJEMPLO_UNLINKED,
  EJEMPLO_STATES,
  EJEMPLO_TAG,
} from "@/help-examples";
import { FORMATOS } from "@/format/formato";
import { formatoPorDefecto } from "@/format/formato-por-defecto";
import { rendir } from "@/rendir";

// La version se lee del package.json publicado en vez de repetirla aqui: escrita
// a mano se queda atras en el primer release que alguien no recuerde tocarla, y
// --version pasa a mentir sin que falle nada.
const requerir = createRequire(import.meta.url);
const { version } = requerir("../package.json") as { version: string };

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
  .version(version)
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

boards
  .command("tag")
  .argument("<ids...>", "ids de work items, p. ej. 11604 11605")
  .option("--add <etiqueta>", "etiqueta adicional (repetible)", acumularOpcionRepetible, [])
  .description(
    `añade la etiqueta "${ETIQUETA_AGENTE}" sin borrar las que el work item ya tenga`,
  )
  .addHelpText("after", EJEMPLO_TAG)
  .action(async (ids: string[], opciones: { add: string[] }) => {
    await rendir((formato) => runTag(ids, opciones.add, formato), formatoElegido());
  });

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
