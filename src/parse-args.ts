/** Argumentos de línea de comandos ya separados en posicionales y banderas. */
export interface ParsedArgs {
  readonly positional: readonly string[];
  readonly flags: Readonly<Record<string, string>>;
}

/**
 * Separa `--clave valor` y `--bandera` del resto.
 *
 * Se hace a mano en vez de traer un parser: son dos formas y ninguna
 * dependencia adicional en el camino del token.
 */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 0; i < argv.length; i += 1) {
    const actual = argv[i] ?? "";
    const esBandera = actual.startsWith("--");
    if (!esBandera) {
      positional.push(actual);
      continue;
    }

    const clave = actual.slice(2);
    const siguiente = argv[i + 1];
    const tieneValor = siguiente !== undefined && !siguiente.startsWith("--");
    flags[clave] = tieneValor ? siguiente : "true";
    if (tieneValor) i += 1;
  }

  return { positional, flags };
}
