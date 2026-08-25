import assert from "node:assert/strict";
import { test } from "node:test";

import { formatoPorDefecto } from "@/format/formato-por-defecto.js";
import { parseFormato } from "@/format/parse-formato.js";

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
