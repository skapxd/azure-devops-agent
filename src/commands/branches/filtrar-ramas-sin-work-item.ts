import { esRamaBase } from "@/commands/branches/es-rama-base.js";

/**
 * Reconoce un número de work item en el nombre de la rama, en cualquier
 * posición y con cualquiera de los separadores que usa la gente: `feat/1234-x`,
 * `back/1234/x`, `algo-1234` o `issue-#1234`, que es la notación de Azure DevOps.
 */
const NUMERO_EN_RAMA = /(?:^|[/_#-])(\d{2,})(?:[/_-]|$)/;

/**
 * ## filtrarRamasSinWorkItem
 *
 * De la salida de `git branch`, deja solo las ramas de trabajo que no
 * referencian ningún work item.
 *
 * Se excluyen las ramas base —`main`, `dev`, `release/*`…— porque nunca tienen
 * ticket y reportarlas sería ruido que tapa las que sí importan.
 *
 * ```ts
 * filtrarRamasSinWorkItem("main\nfeat/1234-algo\nfix/rapido\n", "main");
 * // ["fix/rapido"]
 * ```
 */
export function filtrarRamasSinWorkItem(
  salidaDeGit: string,
  ramaPorDefecto: string,
): readonly string[] {
  return salidaDeGit
    .split("\n")
    .map((rama) => rama.trim())
    .filter((rama) => rama.length > 0)
    .filter((rama) => !esRamaBase(rama, ramaPorDefecto))
    .filter((rama) => !NUMERO_EN_RAMA.test(rama));
}
