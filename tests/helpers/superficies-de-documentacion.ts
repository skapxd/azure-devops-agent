import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ejecutarCli } from "./ejecutar-cli.js";

/**
 * Utilidades para contrastar la documentación con el CLI que se publica.
 *
 * Se lee el binario compilado, no el código: lo que la gente copia del README
 * es lo que ejecuta `dist/cli.js`, y un comando puede existir en el fuente pero
 * haberse quedado sin registrar en el bundle.
 */

const RAIZ = new URL("../..", import.meta.url);

/** Grupos de comandos del CLI. Los subcomandos se descubren preguntándole. */
const GRUPOS = ["boards", "branches"] as const;

export function leerDoc(ruta: string): string {
  return readFileSync(new URL(ruta, RAIZ), "utf8");
}

/** Los subcomandos que el CLI compilado registra de verdad, como "boards tag". */
export function comandosRealesDelCli(): Set<string> {
  const encontrados = new Set<string>();

  for (const grupo of GRUPOS) {
    // fileURLToPath y no RAIZ.pathname: en Windows eso devuelve "/C:/Users/..."
    // —con la barra de más— que no es un directorio válido. execFileSync falla,
    // ejecutarCli devuelve stdout vacío y el conjunto sale vacío sin avisar.
    const { stdout } = ejecutarCli([grupo, "--help"], fileURLToPath(RAIZ));
    const seccion = stdout.split("Commands:")[1] ?? "";
    for (const linea of seccion.split("\n")) {
      const nombre = /^\s{2}(\w[\w-]*)/.exec(linea)?.[1];
      const esComando = nombre !== undefined && nombre !== "help";
      if (esComando) encontrados.add(`${grupo} ${nombre}`);
    }
  }

  // Si esto queda vacío es que el CLI no se pudo ejecutar, no que no tenga
  // comandos. Sin este corte, quien lea el fallo culpa al README —"muestra un
  // comando inexistente"— en vez de a la invocación, que es lo que fallo.
  const noSePudoListar = encontrados.size === 0;
  if (noSePudoListar) throw new Error("no se pudo listar los comandos del CLI compilado");

  return encontrados;
}

/** Las invocaciones del CLI que el README muestra como ejemplo. */
export function invocacionesDelReadme(readme: string): readonly string[] {
  const PATRON =
    /(?:npx|pnpx) (?:@skapxd\/azure-devops-agent|~\/dev\/azure-devops-agent) ([\w-]+)(?: ([\w-]+))?/g;

  const invocaciones: string[] = [];
  for (const coincidencia of readme.matchAll(PATRON)) {
    const grupo = coincidencia[1];
    if (grupo === undefined) continue;
    const sub = coincidencia[2];
    invocaciones.push(sub === undefined ? grupo : `${grupo} ${sub}`);
  }
  return invocaciones;
}
