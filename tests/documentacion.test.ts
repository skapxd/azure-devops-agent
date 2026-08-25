import assert from "node:assert/strict";
import { describe, test } from "vitest";

import {
  comandosRealesDelCli,
  invocacionesDelReadme,
  leerDoc,
} from "@test/superficies-de-documentacion";

const SUPERFICIES = [
  "README.md",
  "skills/azure-devops/SKILL.md",
  "src/help-examples.ts",
] as const;

describe("documentación", () => {
  // Este es el fallo que hace inútil una consulta de ejemplo: @project no
  // resuelve en `az boards query` y devuelve cero filas SIN dar error, así que
  // quien la copie concluye "no existe" y acaba creando un duplicado.
  test("ninguna consulta de ejemplo usa la macro @project", () => {
    for (const ruta of SUPERFICIES) {
      assert.doesNotMatch(leerDoc(ruta), /=\s*@project/, `${ruta} propone @project`);
    }
  });

  // CONTAINS ya compara la etiqueta entera; CONTAINS WORDS sugiere que hace
  // falta protegerse de coincidencias parciales que no llegan a ocurrir.
  test("no se recomienda CONTAINS WORDS para etiquetas", () => {
    for (const ruta of SUPERFICIES) {
      assert.doesNotMatch(leerDoc(ruta), /CONTAINS WORDS/, `${ruta} usa CONTAINS WORDS`);
    }
  });

  test("cada comando del CLI aparece en el README", () => {
    const readme = leerDoc("README.md");
    for (const comando of comandosRealesDelCli()) {
      assert.ok(readme.includes(comando), `el README no documenta "${comando}"`);
    }
  });

  test("cada comando de ejemplo del README existe en el CLI", () => {
    const reales = comandosRealesDelCli();
    for (const invocacion of invocacionesDelReadme(leerDoc("README.md"))) {
      assert.ok(reales.has(invocacion), `el README muestra "${invocacion}", inexistente`);
    }
  });
});
