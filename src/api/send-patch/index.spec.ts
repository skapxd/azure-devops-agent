import assert from "node:assert/strict";

import { test } from "vitest";

import { sendPatch } from "@/api/send-patch";
import { conFetchFalso } from "@test/con-fetch-falso";
import { conToken } from "@test/con-token";

test("las escrituras van como json-patch, que es lo que exige la API", conToken(async () => {
  const llamadas = await conFetchFalso(
    () => ({ estado: 200, json: { id: 42 } }),
    async () => {
      await sendPatch(
        "https://dev.azure.com/Org/Proy/_apis/wit/workitems/$Task",
        [{ op: "add", path: "/fields/System.Title", value: "Algo" }],
        "POST",
      );
    },
  );

  const llamada = llamadas[0];
  assert.ok(llamada);
  assert.equal(llamada.metodo, "POST");
  assert.deepEqual(llamada.cuerpo, [
    { op: "add", path: "/fields/System.Title", value: "Algo" },
  ]);
}));
