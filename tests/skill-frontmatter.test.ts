import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";

const raizDelRepo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const carpetaDeSkills = path.join(raizDelRepo, "skills");

function rutasDeSkills(): string[] {
  return readdirSync(carpetaDeSkills, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => path.join(carpetaDeSkills, entrada.name, "SKILL.md"));
}

// `npx skills add` descarta en silencio cualquier SKILL.md cuyo frontmatter no
// parsee, y lo unico que ve quien instala es "No skills found". Un `: ` sin
// comillas dentro de la descripcion basta para dejar la skill ilegible sin que
// falle ningun build.
test("el frontmatter de cada skill parsea como YAML y declara nombre y descripcion", () => {
  const skills = rutasDeSkills();
  assert.ok(skills.length > 0, "no se encontro ninguna skill en skills/");

  for (const ruta of skills) {
    const contenido = readFileSync(ruta, "utf8");
    const delimitado = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(contenido);
    assert.ok(delimitado, `${ruta} no empieza con un bloque de frontmatter`);

    const bloque = delimitado[1];
    assert.ok(bloque, `${ruta} tiene el frontmatter vacio`);

    const frontmatter = parse(bloque) as Record<string, unknown>;

    assert.equal(typeof frontmatter.name, "string", `${ruta} no declara name`);
    assert.equal(typeof frontmatter.description, "string", `${ruta} no declara description`);
    assert.ok((frontmatter.name as string).length > 0, `${ruta} tiene name vacio`);
    assert.ok((frontmatter.description as string).length > 0, `${ruta} tiene description vacia`);
  }
});
