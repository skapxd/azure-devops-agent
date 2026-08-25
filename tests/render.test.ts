import assert from "node:assert/strict";
import { test } from "node:test";

import { parseFormato } from "@/format/parse-formato.js";
import { renderEstados } from "@/format/render-estados.js";
import { renderRamasHuerfanas } from "@/format/render-ramas-huerfanas.js";

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

test("las ramas huérfanas se cuentan y pluralizan en markdown", () => {
  const una = renderRamasHuerfanas(["fix/algo"], "markdown");
  assert.match(una, /\*\*1 rama sin work item asociado:\*\*/);

  const varias = renderRamasHuerfanas(["a", "b"], "markdown");
  assert.match(varias, /\*\*2 ramas sin work item asociado:\*\*/);
});

test("sin ramas huérfanas el mensaje es el mismo en markdown y text", () => {
  const esperado = "(ninguna — no hay ramas de trabajo sin registrar)";
  assert.equal(renderRamasHuerfanas([], "markdown"), esperado);
  assert.equal(renderRamasHuerfanas([], "text"), esperado);
});

test("json de ramas huérfanas es una lista, también cuando está vacía", () => {
  assert.deepEqual(JSON.parse(renderRamasHuerfanas([], "json")), { orphans: [] });
});

test("un formato desconocido se rechaza en vez de caer al predeterminado", () => {
  const bueno = parseFormato("json");
  assert.equal(bueno.ok && bueno.value, "json");

  const malo = parseFormato("markdwon");
  assert.equal(malo.ok, false);
});
