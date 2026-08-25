import assert from "node:assert/strict";
import { test } from "vitest";

import { renderEtiquetados } from "@/commands/boards/render-etiquetados.js";

const ETIQUETADOS = [
  { id: "11604", etiquetas: ["qa", "agent"], cambiado: true },
  { id: "11605", etiquetas: ["agent"], cambiado: false },
];

test("json expone la clave tagged y si se escribió o no", () => {
  const datos = JSON.parse(renderEtiquetados(ETIQUETADOS, "json")) as {
    tagged: { id: string; cambiado: boolean }[];
  };
  assert.equal(datos.tagged.length, 2);
  assert.equal(datos.tagged[0]?.cambiado, true);
  assert.equal(datos.tagged[1]?.cambiado, false);
});

test("text no lleva marcas de markdown", () => {
  const salida = renderEtiquetados(ETIQUETADOS, "text");
  assert.doesNotMatch(salida, /\*\*|`/);
  assert.match(salida, /#11604/);
});

test("markdown distingue lo escrito de lo que ya estaba", () => {
  const salida = renderEtiquetados(ETIQUETADOS, "markdown");
  assert.match(salida, /\*\*Huella estampada\*\*/);
  // Saber cuál se tocó importa: solo esos generan revisión y notifican.
  assert.match(salida, /#11605.*ya la tenía/);
  assert.doesNotMatch(salida, /#11604 — `qa`, `agent` _\(ya la tenía\)_/);
});
