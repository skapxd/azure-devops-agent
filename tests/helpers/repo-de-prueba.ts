import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * ## repoDePrueba
 *
 * Crea un repositorio git desechable con un remote de Azure DevOps y las ramas
 * indicadas, y devuelve su ruta más una función para borrarlo.
 *
 * Es lo que permite probar el CLI de punta a punta sin red ni token: el remote
 * es falso pero tiene la forma real, y `branches unlinked` solo mira git local.
 *
 * ```ts
 * const { ruta, limpiar } = repoDePrueba(["main", "fix/algo"]);
 * ```
 */
export function repoDePrueba(ramas: readonly string[], remote: string): {
  ruta: string;
  limpiar: () => void;
} {
  const ruta = mkdtempSync(join(tmpdir(), "ado-e2e-"));
  const git = (...args: string[]): void => {
    execFileSync("git", args, { cwd: ruta, stdio: "ignore" });
  };

  git("init", "-q", "-b", ramas[0] ?? "main");
  git("config", "user.email", "prueba@ejemplo.com");
  git("config", "user.name", "Prueba");
  git("commit", "-q", "--allow-empty", "-m", "inicial");
  git("remote", "add", "origin", remote);
  for (const rama of ramas.slice(1)) git("branch", rama);

  return { ruta, limpiar: () => rmSync(ruta, { recursive: true, force: true }) };
}
