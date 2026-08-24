#!/usr/bin/env node
import { Result } from "@skapxd/result";
import { match } from "ts-pattern";

import { runCheck } from "./commands/run-check.js";
import { runContext } from "./commands/run-context.js";
import { createOptionsFromFlags } from "./commands/boards/create-options-from-flags.js";
import { runCreate } from "./commands/boards/run-create.js";
import { runIteration } from "./commands/boards/run-iteration.js";
import { runList } from "./commands/boards/run-list.js";
import { runOrphans } from "./commands/boards/run-orphans.js";
import { runSearch } from "./commands/boards/run-search.js";
import { runShow } from "./commands/boards/run-show.js";
import { runStates } from "./commands/boards/run-states.js";
import { runTypes } from "./commands/boards/run-types.js";
import { runUpdate } from "./commands/boards/run-update.js";
import { updateOptionsFromFlags } from "./commands/boards/update-options-from-flags.js";
import { describeAdoError } from "./errors/describe-ado-error.js";
import type { AdoError } from "./errors/ado-error.js";
import { comandoDesconocido } from "./comando-desconocido.js";
import { parseArgs } from "./parse-args.js";
import { USAGE } from "./usage.js";

async function ejecutar(): Promise<Result<void, AdoError>> {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const [area = "help", accion = "", ...resto] = positional;

  return match(area)
    .with("help", "--help", "-h", async () => {
      console.log(USAGE);
      return Result.ok(undefined);
    })
    .with("context", async () => runContext(flags["json"] !== undefined))
    .with("check", async () => runCheck())
    .with("boards", async () =>
      match(accion)
        .with("types", async () => runTypes())
        .with("states", async () => runStates(resto.join(" ")))
        .with("iteration", async () => runIteration())
        .with("search", async () => runSearch(resto.join(" ")))
        .with("show", async () => runShow(resto[0] ?? ""))
        .with("orphans", async () => runOrphans())
        .with("list", async () => runList(flags["assignee"] ?? ""))
        .with("create", async () => runCreate(createOptionsFromFlags(flags)))
        .with("update", async () => runUpdate(updateOptionsFromFlags(resto[0] ?? "", flags)))
        .otherwise(async () => comandoDesconocido(`boards ${accion}`)),
    )
    .otherwise(async () => comandoDesconocido(area));
}

const resultado = await ejecutar();
if (Result.isErr(resultado)) {
  // Solo el mensaje: nunca el token ni la cabecera de autenticación.
  console.error(`error: ${describeAdoError(resultado.error)}`);
  process.exit(1);
}
