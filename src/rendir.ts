import { Result } from "@skapxd/result";

import type { CliError } from "@/errors/cli-error.js";
import { describeCliError } from "@/errors/describe-cli-error.js";
import type { Formato } from "@/format/formato.js";
import { parseFormato } from "@/format/parse-formato.js";

/** Un comando: recibe el formato ya validado y hace su trabajo. */
type Comando = (
  formato: Formato,
) => Result<void, CliError> | Promise<Result<void, CliError>>;

/**
 * ## rendir
 *
 * Ejecuta un comando y traduce su resultado a la salida del proceso.
 *
 * Es el único punto donde un fallo se convierte en mensaje y código de salida.
 * Los comandos devuelven `Result` en vez de lanzar, así que concentrar aquí la
 * traducción evita que cada uno decida por su cuenta cómo reportar y con qué
 * código terminar.
 *
 * Valida el formato antes de ejecutar: no tiene sentido consultar la API para
 * luego descubrir que no se sabe cómo mostrar la respuesta.
 *
 * Solo se imprime el mensaje del error, nunca el token ni la cabecera de
 * autenticación.
 *
 * ```ts
 * await rendir((formato) => runStates("Task", formato), "markdown");
 * // imprime la salida, o el error y sale con 1
 * ```
 */
export async function rendir(
  comando: Comando,
  formatoSolicitado: string,
): Promise<void> {
  const formato = parseFormato(formatoSolicitado);
  const formatoInvalido = Result.isErr(formato);
  const resultado = formatoInvalido ? formato : await comando(formato.value);

  const fallo = Result.isErr(resultado);
  if (!fallo) return;

  console.error(`error: ${describeCliError(resultado.error)}`);
  process.exit(1);
}
