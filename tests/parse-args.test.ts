import assert from "node:assert/strict";
import { test } from "node:test";

import { parseArgs } from "@/parse-args.js";

test("separa posicionales de banderas con valor", () => {
  const { positional, flags } = parseArgs([
    "boards", "create", "--type", "Bug", "--title", "Algo roto",
  ]);
  assert.deepEqual(positional, ["boards", "create"]);
  assert.equal(flags["type"], "Bug");
  assert.equal(flags["title"], "Algo roto");
});

test("una bandera sin valor queda en true", () => {
  const { flags } = parseArgs(["context", "--json"]);
  assert.equal(flags["json"], "true");
});

test("no confunde la siguiente bandera con el valor de la anterior", () => {
  const { flags } = parseArgs(["boards", "list", "--json", "--assignee", "a@b.c"]);
  assert.equal(flags["json"], "true");
  assert.equal(flags["assignee"], "a@b.c");
});

test("conserva valores con espacios y acentos", () => {
  const { flags } = parseArgs(["--title", "Añadir campo de otros ingresos"]);
  assert.equal(flags["title"], "Añadir campo de otros ingresos");
});
