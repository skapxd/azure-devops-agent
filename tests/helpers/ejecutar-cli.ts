import { execFileSync } from "node:child_process";

import { Result, trySafe } from "@skapxd/result";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export interface SalidaCli {
  readonly codigo: number;
  readonly stdout: string;
  readonly stderr: string;
}

/**
 * ## ejecutarCli
 *
 * Ejecuta el CLI compilado como lo haría una persona y devuelve su salida.
 *
 * Se invoca `dist/cli.js` a propósito, no el código fuente: lo que se publica es
 * el bundle, y un fallo de empaquetado —un import que tsup no resuelve, un
 * comando que se quedó sin registrar— solo aparece ejecutándolo.
 *
 * Se ejecuta sin token y con HOME apuntando a un directorio vacío. Las dos cosas
 * hacen falta: quitar la variable de entorno no basta, porque el CLI cae luego a
 * buscarla en los perfiles de shell del usuario — y entonces la prueba usaría un
 * token real y saldría a internet, que es justo lo que no debe pasar.
 */
export function ejecutarCli(args: readonly string[], cwd: string): SalidaCli {
  const entorno = { ...process.env };
  delete entorno["AZURE_DEVOPS_EXT_PAT"];
  entorno["HOME"] = mkdtempSync(join(tmpdir(), "ado-e2e-home-"));

  const ejecucion = trySafe(() =>
    execFileSync("node", [join(RAIZ, "dist", "cli.js"), ...args], {
      cwd,
      encoding: "utf8",
      env: entorno,
      // execFileSync deja pasar stderr al proceso padre salvo que se pida
      // explicitamente. Sin esto, cada prueba que comprueba un error imprime su
      // mensaje en la salida del runner y parece que algo fallo.
      stdio: ["pipe", "pipe", "pipe"],
    }),
  );

  const salioOk = Result.isOk(ejecucion);
  if (salioOk) return { codigo: 0, stdout: ejecucion.value, stderr: "" };

  // Un exit distinto de 0 llega como excepción con la salida ya capturada.
  const fallo = ejecucion.error as {
    status?: number;
    stdout?: string;
    stderr?: string;
  };
  return {
    codigo: fallo.status ?? 1,
    stdout: fallo.stdout ?? "",
    stderr: fallo.stderr ?? "",
  };
}
