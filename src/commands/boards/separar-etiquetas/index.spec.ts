import assert from "node:assert/strict";
import { describe, test } from "vitest";

import { separarEtiquetas } from "@/commands/boards/separar-etiquetas";

describe("separarEtiquetas", () => {
  test("separar tolera el formato real del campo y el campo vacío", () => {
    assert.deepEqual(separarEtiquetas("qa; urgente"), ["qa", "urgente"]);
    // Azure DevOps devuelve "a; b", pero por API puede llegar sin espacios.
    assert.deepEqual(separarEtiquetas("qa;urgente"), ["qa", "urgente"]);
    assert.deepEqual(separarEtiquetas(""), []);
    assert.deepEqual(separarEtiquetas("  ;  "), []);
  });
});
