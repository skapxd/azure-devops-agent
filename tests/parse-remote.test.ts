import assert from "node:assert/strict";
import { test } from "node:test";

import { parseRemote } from "../skills/azure-devops/scripts/ado-context.js";

const resumen = (url: string): string | null => {
  const r = parseRemote(url);
  return r ? `${r.org}/${r.project}/${r.repo}` : null;
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
  // Estos valores acabarían dentro de una URL, así que se rechazan antes.
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
  const r = parseRemote("git@ssh.dev.azure.com:v3/Mi Org/Proy/Repo");
  assert.ok(r);
  assert.equal(r.orgUrl, "https://dev.azure.com/Mi%20Org");
});
