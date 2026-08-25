import { Result, trySafe } from "@skapxd/result";

/**
 * ## sinRuido
 *
 * Silencia `console.log` mientras se ejecuta algo.
 *
 * Los comandos imprimen su resultado, y en las pruebas que comprueban la
 * petición esa salida solo ensucia el informe.
 */
export async function sinRuido(ejecutar: () => Promise<void>): Promise<void> {
  const original = console.log;
  console.log = (): void => undefined;

  const ejecucion = await trySafe(async () => ejecutar());
  console.log = original;
  if (Result.isErr(ejecucion)) throw ejecucion.error;
}
