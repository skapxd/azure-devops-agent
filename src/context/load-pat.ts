import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { Result, trySafe } from "@skapxd/result";

import { perfilesConToken } from "@/context/perfiles-con-token.js";

/**
 * ## loadPat
 *
 * Busca el Personal Access Token en el entorno y, si no está, en los perfiles
 * de shell del sistema operativo actual.
 *
 * El rodeo por los perfiles existe porque un shell no interactivo no carga
 * `.zshrc`: la variable está declarada, el usuario jura que la exportó, y aun
 * así `process.env` no la tiene.
 *
 * Los perfiles se leen como texto y se extrae el valor con una expresión
 * regular: nunca se evalúan. Ejecutar el contenido de un archivo del usuario
 * sería inyección de código, aunque el archivo sea suyo.
 *
 * ```ts
 * loadPat(); // "abc123…" | null
 * ```
 */
export function loadPat(): string | null {
  const delEntorno = process.env["AZURE_DEVOPS_EXT_PAT"];
  const vieneDelEntorno = Boolean(delEntorno);
  if (vieneDelEntorno) return delEntorno ?? null;

  for (const perfil of perfilesConToken(process.platform)) {
    const lectura = trySafe(() => readFileSync(join(homedir(), perfil.ruta), "utf8"));
    const perfilIlegible = Result.isErr(lectura);
    if (perfilIlegible) continue;

    const declaracion = lectura.value.match(perfil.patron);
    const token = declaracion?.[1];
    if (token) return token;
  }
  return null;
}
