import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, test } from "vitest";

import { ejecutarCli } from "./helpers/ejecutar-cli.js";
import { repoDePrueba } from "./helpers/repo-de-prueba.js";

const REMOTE_ADO = "git@ssh.dev.azure.com:v3/MiOrg/Mi%20Proyecto/MiRepo";

describe("branches unlinked", () => {
  let repo: { ruta: string; limpiar: () => void };

  beforeAll(() => {
    repo = repoDePrueba(
      ["main", "dev", "feat/1234-con-ticket", "fix/sin-ticket", "back/n-a/otra"],
      REMOTE_ADO,
    );
  });
  afterAll(() => repo.limpiar());

  test("lista solo las ramas de trabajo sin ticket", () => {
    const { codigo, stdout } = ejecutarCli(["branches", "unlinked"], repo.ruta);
    assert.equal(codigo, 0);
    assert.match(stdout, /fix\/sin-ticket/);
    assert.match(stdout, /back\/n-a\/otra/);
    // Las base y las que ya referencian un work item no deben aparecer.
    assert.doesNotMatch(stdout, /\bmain\b/);
    assert.doesNotMatch(stdout, /\bdev\b/);
    assert.doesNotMatch(stdout, /1234/);
  });

  test("--format json devuelve algo parseable con la clave unlinked", () => {
    const { stdout } = ejecutarCli(
      ["branches", "unlinked", "--format", "json"],
      repo.ruta,
    );
    const datos = JSON.parse(stdout) as { unlinked: string[] };
    assert.deepEqual(datos.unlinked.sort(), ["back/n-a/otra", "fix/sin-ticket"]);
  });

  test("--format text no lleva marcas de markdown", () => {
    const { stdout } = ejecutarCli(
      ["branches", "unlinked", "--format", "text"],
      repo.ruta,
    );
    assert.doesNotMatch(stdout, /\*\*/);
    assert.match(stdout, /fix\/sin-ticket/);
  });

  test("--format markdown lleva negrita y backticks", () => {
    const { stdout } = ejecutarCli(
      ["branches", "unlinked", "--format", "markdown"],
      repo.ruta,
    );
    assert.match(stdout, /\*\*.*ramas sin work item/);
    assert.match(stdout, /- `fix\/sin-ticket`/);
  });
});

describe("errores de uso", () => {
  let repo: { ruta: string; limpiar: () => void };
  beforeAll(() => {
    repo = repoDePrueba(["main"], REMOTE_ADO);
  });
  afterAll(() => repo.limpiar());

  test("un formato desconocido falla con exit 1 y lo dice", () => {
    const { codigo, stderr } = ejecutarCli(
      ["branches", "unlinked", "--format", "yaml"],
      repo.ruta,
    );
    assert.equal(codigo, 1);
    assert.match(stderr, /formato desconocido: yaml/);
  });

  test("un comando desconocido falla", () => {
    const { codigo } = ejecutarCli(["boards", "frobnicate"], repo.ruta);
    assert.notEqual(codigo, 0);
  });

  test("create sin --parent se rechaza", () => {
    const { codigo, stderr } = ejecutarCli(
      ["boards", "create", "--type", "Task", "--title", "x"],
      repo.ruta,
    );
    assert.equal(codigo, 1);
    assert.match(stderr, /--parent/);
  });

  test("tag sin ids se rechaza antes de tocar la red", () => {
    const { codigo, stderr } = ejecutarCli(["boards", "tag"], repo.ruta);
    assert.equal(codigo, 1);
    assert.match(stderr, /ids/);
  });

  test("sin token, un comando que necesita red lo dice claramente", () => {
    const { codigo, stderr } = ejecutarCli(["boards", "states", "Task"], repo.ruta);
    assert.equal(codigo, 1);
    assert.match(stderr, /AZURE_DEVOPS_EXT_PAT/);
  });
});

describe("fuera de un repositorio de Azure DevOps", () => {
  let repo: { ruta: string; limpiar: () => void };
  beforeAll(() => {
    repo = repoDePrueba(["main"], "git@github.com:usuario/repo.git");
  });
  afterAll(() => repo.limpiar());

  test("branches unlinked funciona igual: solo mira git local", () => {
    const { codigo } = ejecutarCli(["branches", "unlinked"], repo.ruta);
    assert.equal(codigo, 0);
  });

  test("un comando de boards avisa de que el remote no es de Azure DevOps", () => {
    const { codigo, stderr } = ejecutarCli(["boards", "states", "Task"], repo.ruta);
    assert.equal(codigo, 1);
    assert.match(stderr, /no es de Azure DevOps/);
  });
});

describe("ayuda", () => {
  let repo: { ruta: string; limpiar: () => void };
  beforeAll(() => {
    repo = repoDePrueba(["main"], REMOTE_ADO);
  });
  afterAll(() => repo.limpiar());

  test("la ayuda general lista los dos grupos de comandos", () => {
    const { stdout } = ejecutarCli(["--help"], repo.ruta);
    assert.match(stdout, /boards/);
    assert.match(stdout, /branches/);
  });

  test("cada comando trae un ejemplo con su salida", () => {
    for (const args of [
      ["branches", "unlinked", "--help"],
      ["boards", "states", "--help"],
      ["boards", "create", "--help"],
      ["boards", "tag", "--help"],
    ]) {
      const { stdout } = ejecutarCli(args, repo.ruta);
      assert.match(stdout, /Para qué sirve:/, `falta en: ${args.join(" ")}`);
      assert.match(stdout, /Ejemplo:/, `falta en: ${args.join(" ")}`);
    }
  });

  test("la ayuda de tag explica por qué az no sirve para esto", () => {
    const { stdout } = ejecutarCli(["boards", "tag", "--help"], repo.ruta);
    // Quien lea esto tiene que entender que --fields System.Tags= borra.
    assert.match(stdout, /ASIGNA el campo entero/);
    // Las dos trampas silenciosas que la ayuda tiene que advertir.
    assert.match(stdout, /etiqueta ENTERA/);
    assert.match(stdout, /@project no resuelve/);
  });

  test("--version coincide con la del paquete publicado", () => {
    const { stdout } = ejecutarCli(["--version"], repo.ruta);
    const { version } = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ) as { version: string };
    assert.equal(stdout.trim(), version);
  });

  test("la invocación que muestra la ayuda es la real, con npx", () => {
    const { stdout } = ejecutarCli(["--help"], repo.ruta);
    assert.match(stdout, /npx @skapxd\/azure-devops-agent/);
  });
});
