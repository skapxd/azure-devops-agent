/**
 * Ramas que existen en casi todos los repos y nunca representan una unidad de
 * trabajo: son líneas de integración o de ambiente.
 */
const NOMBRES_BASE = new Set([
  "main",
  "master",
  "trunk",
  "dev",
  "develop",
  "development",
  "qa",
  "qa-one",
  "qa-two",
  "staging",
  "stage",
  "uat",
  "pre-prod",
  "preprod",
  "pre-produccion",
  "prod",
  "produccion",
  "production",
  "release",
]);

/**
 * ## esRamaBase
 *
 * Decide si una rama es de integración o ambiente en vez de trabajo.
 *
 * Marcarlas como "sin work item" sería técnicamente cierto y prácticamente
 * inútil: nadie abre un ticket para `main`. Un comando que reporta ruido en la
 * primera ejecución pierde la credibilidad que necesita para que le hagan caso.
 *
 * ```ts
 * esRamaBase("main", "main");            // true
 * esRamaBase("release/2026.08", "main"); // true  — prefijo de línea de release
 * esRamaBase("fix/algo", "main");        // false
 * ```
 */
export function esRamaBase(rama: string, ramaPorDefecto: string): boolean {
  const nombre = rama.trim().toLowerCase();
  const esLaPorDefecto = nombre === ramaPorDefecto.trim().toLowerCase();
  if (esLaPorDefecto) return true;

  const tieneNombreDeLineaBase = NOMBRES_BASE.has(nombre);
  if (tieneNombreDeLineaBase) return true;

  // release/2026.08, hotfix/x: líneas de mantenimiento, no trabajo individual.
  const raiz = nombre.split("/")[0] ?? "";
  return raiz === "release" || raiz === "hotfix";
}
