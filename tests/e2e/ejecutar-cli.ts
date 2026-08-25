import { execFileSync } from "node:child_process";
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

  try {
    const stdout = execFileSync("node", [join(RAIZ, "dist", "cli.js"), ...args], {
      cwd,
      encoding: "utf8",
      env: entorno,
    });
    return { codigo: 0, stdout, stderr: "" };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return {
      codigo: e.status ?? 1,
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
    };
  }
}
