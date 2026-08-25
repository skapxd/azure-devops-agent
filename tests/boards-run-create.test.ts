import assert from "node:assert/strict";
import { test } from "node:test";

import { Result } from "@skapxd/result";

import { runCreate } from "@/commands/boards/run-create.js";
import { conFetchFalso } from "./helpers/con-fetch-falso.js";
import { enUnRepoAzureDevOps } from "./helpers/en-un-repo-azure-devops.js";

test("crear con padre manda el enlace en la MISMA petición", async () => {
  await enUnRepoAzureDevOps(async () => {
    const llamadas = await conFetchFalso(
      () => ({ estado: 200, json: { id: 11607 } }),
      async () => {
        const r = await runCreate(
          { type: "Task", title: "Quitar el índice", parent: "11603" },
          "text",
        );
        assert.ok(Result.isOk(r));
      },
    );

    // Una sola llamada: si fueran dos, un fallo entre medias dejaría un huérfano.
    assert.equal(llamadas.length, 1);

    const operaciones = llamadas[0]?.cuerpo as { op: string; path: string; value: unknown }[];
    const enlace = operaciones.find((o) => o.path === "/relations/-");
    assert.ok(enlace, "falta la relación con el padre");
    assert.deepEqual(enlace.value, {
      rel: "System.LinkTypes.Hierarchy-Reverse",
      url: "https://dev.azure.com/MiOrg/_apis/wit/workItems/11603",
    });
  });
});

test("los campos opcionales solo se envían si se piden", async () => {
  await enUnRepoAzureDevOps(async () => {
    const llamadas = await conFetchFalso(
      () => ({ estado: 200, json: { id: 1 } }),
      async () => {
        await runCreate({ type: "Task", title: "Mínimo", parent: "10" }, "text");
      },
    );

    const rutas = (llamadas[0]?.cuerpo as { path: string }[]).map((o) => o.path);
    assert.deepEqual(rutas, [
      "/fields/System.Title",
      "/fields/System.Tags",
      "/relations/-",
    ]);
    assert.ok(!rutas.includes("/fields/System.AssignedTo"));
  });
});

test("todo lo que se crea nace con la huella, para poder filtrarlo después", async () => {
  await enUnRepoAzureDevOps(async () => {
    const llamadas = await conFetchFalso(
      () => ({ estado: 200, json: { id: 1 } }),
      async () => {
        await runCreate({ type: "Task", title: "x", parent: "10" }, "text");
      },
    );
    const cuerpo = llamadas[0]?.cuerpo as { path: string; value: unknown }[];
    const etiquetas = cuerpo.find((o) => o.path === "/fields/System.Tags");
    // En la misma llamada que crea: ponerla después sería otra revisión, y una
    // ventana en la que el work item existe pero no se puede filtrar.
    assert.equal(etiquetas?.value, "agent");
  });
});

test("con todos los campos, cada uno va a su ruta", async () => {
  await enUnRepoAzureDevOps(async () => {
    const llamadas = await conFetchFalso(
      () => ({ estado: 200, json: { id: 1 } }),
      async () => {
        await runCreate(
          {
            type: "Bug",
            title: "Algo falla",
            parent: "10",
            description: "<b>Pasos</b>",
            assign: "persona@ejemplo.com",
            iteration: "Proy\\Sprint 95",
          },
          "text",
        );
      },
    );

    const cuerpo = llamadas[0]?.cuerpo as { path: string; value: unknown }[];
    const porRuta = new Map(cuerpo.map((o) => [o.path, o.value]));
    assert.equal(porRuta.get("/fields/System.Title"), "Algo falla");
    assert.equal(porRuta.get("/fields/System.Description"), "<b>Pasos</b>");
    assert.equal(porRuta.get("/fields/System.AssignedTo"), "persona@ejemplo.com");
    assert.equal(porRuta.get("/fields/System.IterationPath"), "Proy\\Sprint 95");
  });
});

test("el tipo va en la URL escapado, para admitir nombres con espacios", async () => {
  await enUnRepoAzureDevOps(async () => {
    const llamadas = await conFetchFalso(
      () => ({ estado: 200, json: { id: 1 } }),
      async () => {
        await runCreate(
          { type: "Product Backlog Item", title: "x", parent: "10" },
          "text",
        );
      },
    );
    assert.match(String(llamadas[0]?.url), /\$Product%20Backlog%20Item/);
  });
});

test("si la API falla, el error se propaga y no se imprime nada como éxito", async () => {
  await enUnRepoAzureDevOps(async () => {
    await conFetchFalso(
      () => ({ estado: 400, json: {} }),
      async () => {
        const r = await runCreate(
          { type: "Task", title: "x", parent: "10" },
          "text",
        );
        assert.ok(Result.isErr(r));
        assert.deepEqual(r.error, { type: "api", status: 400 });
      },
    );
  });
});
