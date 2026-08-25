import assert from "node:assert/strict";
import { describe, test } from "vitest";

import { combinarEtiquetas } from "@/commands/boards/combinar-etiquetas";

describe("combinarEtiquetas", () => {
  test("añadir la huella conserva las etiquetas que ya estaban", () => {
    // Este es el fallo que hace irreparable usar `az --fields System.Tags=agent`:
    // qa y urgente desaparecerían sin aviso.
    assert.equal(combinarEtiquetas("qa; urgente", ["agent"]), "qa; urgente; agent");
  });

  test("estampar dos veces no escribe: devuelve null", () => {
    // Cada escritura crea una revisión y notifica a quien siga el work item.
    assert.equal(combinarEtiquetas("qa; agent", ["agent"]), null);
    assert.equal(combinarEtiquetas("agent", ["agent"]), null);
  });

  test("la comparación ignora mayúsculas, como Azure DevOps", () => {
    // Añadir "agent" teniendo "Agent" no daría dos etiquetas: daría un duplicado
    // invisible en el tablero.
    assert.equal(combinarEtiquetas("Agent", ["agent"]), null);
    assert.equal(combinarEtiquetas("QA", ["qa", "agent"]), "QA; agent");
  });

  test("un work item sin etiquetas queda solo con la huella", () => {
    assert.equal(combinarEtiquetas("", ["agent"]), "agent");
  });

  test("las etiquetas repetidas en la misma llamada no se duplican", () => {
    assert.equal(combinarEtiquetas("", ["agent", "agent", " agent "]), "agent");
  });

  test("las etiquetas extra se añaden junto a la huella", () => {
    assert.equal(combinarEtiquetas("qa", ["agent", "deuda"]), "qa; agent; deuda");
  });
});
