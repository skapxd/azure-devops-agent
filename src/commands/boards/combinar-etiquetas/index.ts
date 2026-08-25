import { separarEtiquetas } from "@/commands/boards/separar-etiquetas";

/** Azure DevOps guarda las etiquetas en un solo campo, separadas por `;`. */
const SEPARADOR = "; ";

/**
 * ## combinarEtiquetas
 *
 * Añade etiquetas a las que el work item ya tiene, sin perder ninguna.
 *
 * Este es el hueco que deja `az`: allí solo existe
 * `--fields "System.Tags=..."`, que **asigna** el campo entero. Quien lo use
 * para "añadir" una etiqueta borra en silencio las que hubiera.
 *
 * Devuelve `null` cuando no hay nada que añadir, para que quien llama se ahorre
 * una escritura inútil — y para que estampar dos veces no genere una revisión
 * nueva en el historial del work item.
 *
 * La comparación ignora mayúsculas porque Azure DevOps también lo hace: añadir
 * `agent` teniendo `Agent` no daría dos etiquetas, daría un duplicado invisible.
 *
 * ```ts
 * combinarEtiquetas("qa", ["agent"]);        // "qa; agent"
 * combinarEtiquetas("qa; agent", ["agent"]); // null
 * ```
 */
export function combinarEtiquetas(
  campoActual: string,
  aAnadir: readonly string[],
): string | null {
  const actuales = separarEtiquetas(campoActual);
  const yaPresentes = new Set(actuales.map((etiqueta) => etiqueta.toLowerCase()));

  const faltantes: string[] = [];
  for (const cruda of aAnadir) {
    const etiqueta = cruda.trim();
    const clave = etiqueta.toLowerCase();
    const sobra = etiqueta.length === 0 || yaPresentes.has(clave);
    if (sobra) continue;
    yaPresentes.add(clave);
    faltantes.push(etiqueta);
  }

  const nadaQueHacer = faltantes.length === 0;
  if (nadaQueHacer) return null;

  return [...actuales, ...faltantes].join(SEPARADOR);
}
