import assert from "node:assert/strict";
import { test } from "vitest";

import { Result } from "@skapxd/result";

import { runTag } from "@/commands/boards/run-tag.js";
import { conFetchFalso } from "./helpers/con-fetch-falso.js";
import { enUnRepoAzureDevOps } from "./helpers/en-un-repo-azure-devops.js";
import {
  conEtiquetasActuales,
  responderLoteMixto,
} from "./helpers/respuestas-de-etiquetas.js";

/** 11604: lectura + escritura. 11605: solo lectura, porque ya la tenía. */
const LLAMADAS_DEL_LOTE_MIXTO = 3;

test("lee las etiquetas actuales antes de escribir, y las conserva", async () => {
  await enUnRepoAzureDevOps(async () => {
    const llamadas = await conFetchFalso(
      conEtiquetasActuales("qa; urgente"),
      async () => {
        const r = await runTag(["11604"], [], "text");
        assert.ok(Result.isOk(r));
      },
    );

    assert.equal(llamadas.length, 2, "debe leer y luego escribir");
    assert.equal(llamadas[0]?.metodo, "GET");
    assert.equal(llamadas[1]?.metodo, "PATCH");

    // Lo que az no puede hacer: qa y urgente siguen ahí.
    assert.deepEqual(llamadas[1]?.cuerpo, [
      { op: "add", path: "/fields/System.Tags", value: "qa; urgente; agent" },
    ]);
  });
});

test("si ya tiene la huella no escribe: se queda en la lectura", async () => {
  await enUnRepoAzureDevOps(async () => {
    const llamadas = await conFetchFalso(conEtiquetasActuales("agent"), async () => {
      const r = await runTag(["11604"], [], "text");
      assert.ok(Result.isOk(r));
    });

    // Escribir de nuevo crearía una revisión y notificaría a quien lo siga.
    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0]?.metodo, "GET");
  });
});

test("un work item sin etiquetas queda solo con la huella", async () => {
  await enUnRepoAzureDevOps(async () => {
    const llamadas = await conFetchFalso(conEtiquetasActuales(""), async () => {
      await runTag(["11604"], [], "text");
    });
    const operaciones = llamadas[1]?.cuerpo as { value: unknown }[];
    assert.equal(operaciones[0]?.value, "agent");
  });
});

test("varios ids se procesan cada uno por su cuenta", async () => {
  await enUnRepoAzureDevOps(async () => {
    const llamadas = await conFetchFalso(responderLoteMixto, async () => {
      await runTag(["11604", "11605"], [], "text");
    });

    assert.equal(llamadas.length, LLAMADAS_DEL_LOTE_MIXTO);
    assert.equal(llamadas.filter((l) => l.metodo === "PATCH").length, 1);
  });
});

test("--add añade etiquetas extra junto a la huella", async () => {
  await enUnRepoAzureDevOps(async () => {
    const llamadas = await conFetchFalso(conEtiquetasActuales(""), async () => {
      await runTag(["11604"], ["deuda-tecnica"], "text");
    });
    const operaciones = llamadas[1]?.cuerpo as { value: unknown }[];
    assert.equal(operaciones[0]?.value, "agent; deuda-tecnica");
  });
});

test("si la lectura falla no se escribe nada", async () => {
  await enUnRepoAzureDevOps(async () => {
    const llamadas = await conFetchFalso(
      () => ({ estado: 404, json: {} }),
      async () => {
        const r = await runTag(["99999"], [], "text");
        assert.ok(Result.isErr(r));
        assert.deepEqual(r.error, { type: "api", status: 404 });
      },
    );
    assert.equal(llamadas.filter((l) => l.metodo === "PATCH").length, 0);
  });
});

test("el token viaja en la cabecera, nunca en la URL", async () => {
  await enUnRepoAzureDevOps(async () => {
    const llamadas = await conFetchFalso(conEtiquetasActuales(""), async () => {
      await runTag(["11604"], [], "text");
    });
    for (const llamada of llamadas) {
      assert.match(String(llamada.autorizacion), /^Basic /);
      assert.doesNotMatch(llamada.url, /token-de-prueba/);
    }
  });
});
