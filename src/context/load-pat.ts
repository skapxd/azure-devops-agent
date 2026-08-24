import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { Result, trySafe } from "@skapxd/result";

const PERFILES = [".zshrc", ".bashrc", ".profile", ".zshenv", ".bash_profile"];
const DECLARACION_PAT = /^\s*export\s+AZURE_DEVOPS_EXT_PAT\s*=\s*["']?([^"'\s#]+)/m;

/**
 * Busca el Personal Access Token en el entorno y, si no está, en los perfiles
 * de shell — que no se cargan en sesiones no interactivas, de ahí el rodeo.
 *
 * Los perfiles se leen como texto y se extrae el valor con una expresión
 * regular: nunca se evalúan. Ejecutar el contenido de un archivo del usuario
 * sería inyección de código, aunque el archivo sea suyo.
 */
export function loadPat(): string | null {
  const delEntorno = process.env["AZURE_DEVOPS_EXT_PAT"];
  const vieneDelEntorno = Boolean(delEntorno);
  if (vieneDelEntorno) return delEntorno ?? null;

  for (const nombre of PERFILES) {
    const lectura = trySafe(() => readFileSync(join(homedir(), nombre), "utf8"));
    const perfilIlegible = Result.isErr(lectura);
    if (perfilIlegible) continue;

    const declaracion = lectura.value.match(DECLARACION_PAT);
    const token = declaracion?.[1];
    if (token) return token;
  }
  return null;
}
