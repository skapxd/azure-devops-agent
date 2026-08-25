import assert from "node:assert/strict";
import { test } from "node:test";

import { formatoPorDefecto } from "@/format/formato-por-defecto.js";
import { parseFormato } from "@/format/parse-formato.js";
import { renderEstados } from "@/format/render-estados.js";
import { renderRamasSinEnlazar } from "@/format/render-ramas-sin-enlazar.js";

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

test("las ramas sin enlazar se cuentan y pluralizan en markdown", () => {
  const una = renderRamasSinEnlazar(["fix/algo"], "markdown");
  assert.match(una, /\*\*1 rama sin work item asociado:\*\*/);

  const varias = renderRamasSinEnlazar(["a", "b"], "markdown");
  assert.match(varias, /\*\*2 ramas sin work item asociado:\*\*/);
});

test("sin ramas sueltas el mensaje es el mismo en markdown y text", () => {
  const esperado = "(ninguna — no hay ramas de trabajo sin registrar)";
  assert.equal(renderRamasSinEnlazar([], "markdown"), esperado);
  assert.equal(renderRamasSinEnlazar([], "text"), esperado);
});

test("el json es una lista, también cuando está vacía", () => {
  assert.deepEqual(JSON.parse(renderRamasSinEnlazar([], "json")), { unlinked: [] });
});

test("un formato desconocido se rechaza en vez de caer al predeterminado", () => {
  const bueno = parseFormato("json");
  assert.equal(bueno.ok && bueno.value, "json");

  const malo = parseFormato("markdwon");
  assert.equal(malo.ok, false);
});

test("el formato por defecto depende de quién lee la salida", () => {
  // En terminal lo lee una persona: los ** y los backticks solo estorban.
  assert.equal(formatoPorDefecto(true), "text");
  // En una tubería lo consume un programa —un agente, casi siempre— y ahí la
  // estructura de markdown es lo que ayuda a interpretarlo.
  assert.equal(formatoPorDefecto(false), "markdown");
});
