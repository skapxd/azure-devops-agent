import assert from "node:assert/strict";
import { test } from "vitest";

import { renderEstados } from "@/commands/boards/render-estados";

test("markdown es el formato por defecto y da estructura, no texto alineado", () => {
  const salida = renderEstados("Task", ["To Do", "Done"], "markdown");
  assert.match(salida, /^Estados de `Task`:/);
  // Lista ordenada: en un workflow el orden ES la información.
  assert.match(salida, /1\. To Do/);
  assert.match(salida, /2\. Done/);
});

test("json es parseable y conserva los datos", () => {
  const salida = renderEstados("Task", ["To Do", "Done"], "json");
  assert.deepEqual(JSON.parse(salida), { type: "Task", states: ["To Do", "Done"] });
});

test("text mantiene la salida compacta de una línea", () => {
  assert.equal(renderEstados("Task", ["To Do", "Done"], "text"), "To Do → Done");
});
