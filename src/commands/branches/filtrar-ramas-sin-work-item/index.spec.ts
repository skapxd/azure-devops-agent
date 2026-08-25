import assert from "node:assert/strict";
import { test } from "vitest";

import { esRamaBase } from "@/commands/branches/es-rama-base";
import { filtrarRamasSinWorkItem } from "@/commands/branches/filtrar-ramas-sin-work-item";

test("las ramas base no cuentan como trabajo sin registrar", () => {
  // El caso que motivó esto: un repo cuyas únicas ramas son dev y main.
  assert.deepEqual(filtrarRamasSinWorkItem("dev\nmain\n", "main"), []);
});

test("respeta la rama principal del repo aunque no se llame main", () => {
  // Hay repos que integran en `dev`; darla por huérfana sería el primer
  // falso positivo que ve el usuario.
  assert.ok(esRamaBase("dev", "dev"));
  assert.ok(esRamaBase("pre-prod", "main"));
});

test("las líneas de release y hotfix tampoco son trabajo individual", () => {
  assert.ok(esRamaBase("release/2026.08", "main"));
  assert.ok(esRamaBase("hotfix/parche", "main"));
});

test("sigue detectando las ramas de trabajo sin ticket", () => {
  const salida = "main\ndev\nfeat/1234-con-ticket\nfix/ajuste-rapido\nback/n-a/algo\n";
  assert.deepEqual(filtrarRamasSinWorkItem(salida, "main"), [
    "fix/ajuste-rapido",
    "back/n-a/algo",
  ]);
});

test("reconoce el número en cualquier posición del nombre", () => {
  const salida = "feat/1234-algo\nback/1234/algo\nalgo-1234\n1234-algo\n";
  assert.deepEqual(filtrarRamasSinWorkItem(salida, "main"), []);
});

test("un nombre de rama que solo contiene un año no cuenta como ticket", () => {
  // Cuatro dígitos sueltos podrían ser un id, así que se aceptan: es preferible
  // dejar pasar una rama a inundar de falsos positivos.
  assert.deepEqual(filtrarRamasSinWorkItem("release-2026\n", "main"), []);
});

test("no distingue mayúsculas en los nombres base", () => {
  assert.ok(esRamaBase("MAIN", "main"));
  assert.ok(esRamaBase("Develop", "main"));
});

test("reconoce la notación #1234 de Azure DevOps", () => {
  // Caso real: back-issue-#5769-inconsistencia sí referencia el work item 5769.
  assert.deepEqual(filtrarRamasSinWorkItem("back-issue-#5769-algo\n", "main"), []);
  // Pero #temp no es un número y sigue contando como sin registrar.
  assert.deepEqual(filtrarRamasSinWorkItem("back-issue-#temp-algo\n", "main"), [
    "back-issue-#temp-algo",
  ]);
});
