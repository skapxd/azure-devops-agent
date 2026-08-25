import assert from "node:assert/strict";
import { describe, test } from "vitest";

import { formatoPorDefecto } from "@/format/formato-por-defecto";

describe("formatoPorDefecto", () => {
  test("el formato por defecto depende de quién lee la salida", () => {
    // En terminal lo lee una persona: los ** y los backticks solo estorban.
    assert.equal(formatoPorDefecto(true), "text");
    // En una tubería lo consume un programa —un agente, casi siempre— y ahí la
    // estructura de markdown es lo que ayuda a interpretarlo.
    assert.equal(formatoPorDefecto(false), "markdown");
  });
});
