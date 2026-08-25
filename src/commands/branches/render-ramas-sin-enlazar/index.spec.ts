import assert from "node:assert/strict";
import { describe, test } from "vitest";

import { renderRamasSinEnlazar } from "@/commands/branches/render-ramas-sin-enlazar";

describe("renderRamasSinEnlazar", () => {
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
});
