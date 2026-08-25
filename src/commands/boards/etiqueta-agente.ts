/**
 * La etiqueta que queda en todo work item creado o modificado desde el repo.
 *
 * Sirve para lo que un tablero heredado hace imposible: separar, entre cientos
 * de tareas asignadas y sin empezar, las que se están gestionando de verdad.
 *
 * ```
 * [System.Tags] CONTAINS 'agent'
 * ```
 *
 * Sobre `System.Tags`, `CONTAINS` **no** busca subcadenas pese al nombre:
 * compara la etiqueta entera. Verificado contra un tablero real con la etiqueta
 * `prioridad 24` — `CONTAINS 'prioridad 24'` la encuentra, `CONTAINS 'prioridad'`
 * y `CONTAINS '24'` no. Así que `agent` nunca va a coincidir con
 * `agente-comercial`, y no hace falta alargar el nombre para protegerse.
 *
 * Los demás operadores de igualdad no están disponibles: Azure DevOps rechaza
 * `=`, `EVER` e `IN` sobre este campo por ser de texto largo.
 */
export const ETIQUETA_AGENTE = "agent";
