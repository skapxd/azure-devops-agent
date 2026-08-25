import assert from "node:assert/strict";
import { test } from "node:test";

import { parseRemote } from "@/repo/parse-remote.js";

const resumen = (url: string): string | null => {
  const contexto = parseRemote(url);
  const noEsAdo = contexto === null;
  if (noEsAdo) return null;
  return `${contexto.org}/${contexto.project}/${contexto.repo}`;
};

test("reconoce los tres formatos de remote de Azure DevOps", () => {
  assert.equal(resumen("git@ssh.dev.azure.com:v3/Org/Proy/Repo"), "Org/Proy/Repo");
  assert.equal(resumen("https://Org@dev.azure.com/Org/Proy/_git/Repo"), "Org/Proy/Repo");
  assert.equal(resumen("https://org.visualstudio.com/Proy/_git/Repo"), "org/Proy/Repo");
});

test("tolera variantes de la misma URL", () => {
  assert.equal(resumen("git@ssh.dev.azure.com:v3/Org/Proy/Repo.git"), "Org/Proy/Repo");
  assert.equal(resumen("https://dev.azure.com/Org/Proy/_git/Repo"), "Org/Proy/Repo");
  assert.equal(resumen("  git@ssh.dev.azure.com:v3/Org/Proy/Repo\n"), "Org/Proy/Repo");
});

test("descarta remotes que no son de Azure DevOps", () => {
  assert.equal(resumen("git@github.com:usuario/repo.git"), null);
  assert.equal(resumen("https://gitlab.com/grupo/repo.git"), null);
  assert.equal(resumen("no-es-una-url"), null);
  assert.equal(resumen(""), null);
});

test("no deja pasar metacaracteres de shell ni path traversal", () => {
  assert.equal(resumen("git@ssh.dev.azure.com:v3/../../evil/Proy/Repo"), null);
  assert.equal(resumen("https://dev.azure.com/Org$(whoami)/Proy/_git/Repo"), null);
  assert.equal(resumen("https://dev.azure.com/Org`id`/Proy/_git/Repo"), null);
  assert.equal(resumen("https://dev.azure.com/Org;rm -rf/Proy/_git/Repo"), null);
  assert.equal(resumen("https://dev.azure.com/Org|cat/Proy/_git/Repo"), null);
});

test("no acepta un host que solo se parece al de Azure", () => {
  assert.equal(resumen("https://evil.com/Org/Proy/_git/Repo"), null);
  assert.equal(resumen("https://dev.azure.com.evil.com/Org/Proy/_git/Repo"), null);
});

test("la URL de organización queda escapada", () => {
  const contexto = parseRemote("git@ssh.dev.azure.com:v3/Mi Org/Proy/Repo");
  assert.ok(contexto);
  assert.equal(contexto.orgUrl, "https://dev.azure.com/Mi%20Org");
});

test("decodifica los segmentos percent-encoded del remote", () => {
  // Caso real: un proyecto con espacios y acentos llega encoded en el remote.
  const contexto = parseRemote(
    "git@ssh.dev.azure.com:v3/MiOrg/Onboarding%20de%20Pr%C3%A9stamos/MiRepo",
  );
  assert.ok(contexto);
  assert.equal(contexto.project, "Onboarding de Préstamos");
});

test("no produce doble encoding en la URL de organización", () => {
  const contexto = parseRemote("git@ssh.dev.azure.com:v3/Mi%20Org/Proy/Repo");
  assert.ok(contexto);
  assert.equal(contexto.org, "Mi Org");
  // Una sola vuelta de encoding: %2520 significaría que se codificó dos veces.
  assert.equal(contexto.orgUrl, "https://dev.azure.com/Mi%20Org");
});

test("rechaza un percent-encoding malformado en vez de reventar", () => {
  assert.equal(parseRemote("git@ssh.dev.azure.com:v3/Org%zz/Proy/Repo"), null);
});

test("reconoce el SSH del dominio antiguo (vs-ssh.visualstudio.com)", () => {
  // Formato real de organizaciones creadas antes de dev.azure.com.
  assert.equal(
    resumen("MiOrg@vs-ssh.visualstudio.com:v3/MiOrg/Mi%20Proyecto/MiRepo"),
    "MiOrg/Mi Proyecto/MiRepo",
  );
  assert.equal(
    resumen("vs-ssh.visualstudio.com:v3/MiOrg/Proy/Repo"),
    "MiOrg/Proy/Repo",
  );
});
