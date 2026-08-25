import assert from "node:assert/strict";

import { Result } from "@skapxd/result";
import { test } from "vitest";

import { fetchJson } from "@/api/fetch-json";
import { conFetchFalso } from "@test/con-fetch-falso";
import { conToken } from "@test/con-token";

test("el token viaja en la cabecera, nunca en la URL", conToken(async () => {
  const llamadas = await conFetchFalso(
    () => ({ estado: 200, json: { value: [] } }),
    async () => {
      await fetchJson("https://dev.azure.com/Org/_apis/algo");
    },
  );

  const llamada = llamadas[0];
  assert.ok(llamada);
  assert.doesNotMatch(llamada.url, /token-de-prueba/);
  // Basic con ":token" en base64, que es lo que espera Azure DevOps.
  assert.equal(
    llamada.autorizacion,
    `Basic ${Buffer.from(":token-de-prueba").toString("base64")}`,
  );
}));

test("un 401 se traduce a token-invalido, no a un error genérico", conToken(async () => {
  await conFetchFalso(
    () => ({ estado: 401, json: {} }),
    async () => {
      const r = await fetchJson("https://dev.azure.com/Org/_apis/algo");
      assert.ok(Result.isErr(r));
      assert.equal(r.error.type, "token-invalido");
    },
  );
}));

test("el 203 de Azure DevOps también significa token inválido", conToken(async () => {
  // Responde 203 con el HTML de login en vez de 401, que es lo que despista.
  await conFetchFalso(
    () => ({ estado: 203, json: {} }),
    async () => {
      const r = await fetchJson("https://dev.azure.com/Org/_apis/algo");
      assert.ok(Result.isErr(r));
      assert.equal(r.error.type, "token-invalido");
    },
  );
}));

test("otros códigos conservan el número para poder diagnosticar", conToken(async () => {
  await conFetchFalso(
    () => ({ estado: 404, json: {} }),
    async () => {
      const r = await fetchJson("https://dev.azure.com/Org/_apis/algo");
      assert.ok(Result.isErr(r));
      assert.deepEqual(r.error, { type: "api", status: 404 });
    },
  );
}));

test("sin token no se llega a hacer la petición", async () => {
  delete process.env["AZURE_DEVOPS_EXT_PAT"];
  const original = process.env["HOME"];
  process.env["HOME"] = "/tmp/sin-perfiles-" + String(Date.now());

  const llamadas = await conFetchFalso(
    () => ({ estado: 200, json: {} }),
    async () => {
      const r = await fetchJson("https://dev.azure.com/Org/_apis/algo");
      assert.ok(Result.isErr(r));
      assert.equal(r.error.type, "sin-token");
    },
  );
  assert.equal(llamadas.length, 0, "no debería salir a la red sin token");
  if (original !== undefined) process.env["HOME"] = original;
});
