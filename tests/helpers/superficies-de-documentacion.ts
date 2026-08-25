import { readFileSync } from "node:fs";

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
    const { stdout } = ejecutarCli([grupo, "--help"], RAIZ.pathname);
    const seccion = stdout.split("Commands:")[1] ?? "";
    for (const linea of seccion.split("\n")) {
      const nombre = /^\s{2}(\w[\w-]*)/.exec(linea)?.[1];
      const esComando = nombre !== undefined && nombre !== "help";
      if (esComando) encontrados.add(`${grupo} ${nombre}`);
    }
  }

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
