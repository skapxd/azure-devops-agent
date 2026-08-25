/**
 * Ejemplos que Commander añade al final del `--help` de cada comando.
 *
 * Una descripción dice qué hace un comando; un ejemplo con su salida real dice
 * para qué sirve y qué esperar. Es la diferencia entre "estados válidos del
 * workflow" y ver la lista numerada que devuelve.
 */

export const EJEMPLO_STATES = `
Para qué sirve:
  Antes de mover un work item, saber a qué estados puedes moverlo. Cada proyecto
  personaliza su workflow, así que inventarlos falla.

Ejemplo:
  $ npx @skapxd/azure-devops-agent boards states Task

  Estados de \`Task\`:

  1. To Do
  2. In Progress
  3. Done
  4. Removed

  $ npx @skapxd/azure-devops-agent boards states "Product Backlog Item" --format text

  New → Approved → In Progress → Por pasar a QA → Test QA → Done
`;

export const EJEMPLO_UNLINKED = `
Para qué sirve:
  Encontrar el trabajo que se está perdiendo. Una rama sin número de work item
  nace de un arreglo rápido, se mergea, y no deja rastro en el tablero.

Ejemplo:
  $ npx @skapxd/azure-devops-agent branches unlinked

  **2 ramas sin work item asociado:**

  - \`fix/ajuste-rapido\`
  - \`back/n-a/duplicar-concesionarios\`

  Reconoce el número en cualquier posición del nombre, así que
  feat/1234-algo y back/1234/algo cuentan como asociadas.
`;

export const EJEMPLO_CREATE = `
Para qué sirve:
  Colgar un work item de su padre sin dejar cabos sueltos. En az son dos pasos
  —crear y luego enlazar—; si el segundo falla, queda un work item huérfano que
  nadie sabe de dónde salió. Aquí, o queda completo o no queda nada.

  Para crear SIN padre usa az, que hace lo mismo:
    az boards work-item create --type Bug --title "..."

Ejemplo:
  $ npx @skapxd/azure-devops-agent boards create --type Task --parent 11603 \\
      --title "Eliminar el índice único de dominio" \\
      --assign persona@ejemplo.com

  Creado **#11607** — Eliminar el índice único de dominio

  - Padre: #11603
  - URL: https://dev.azure.com/MiOrg/MiProyecto/_workitems/edit/11607

Consejo:
  --description se renderiza como HTML: usa <br>, <ul><li> y <b>. Los saltos de
  línea planos se pierden y el texto queda en un párrafo ilegible.
`;

export const EJEMPLO_GENERAL = `
Empieza por aquí:
  az ya sabe en qué proyecto estás — lo detecta del git remote:
    $ az repos list --query "[0].project.name" -o tsv
    MiProyecto

  Y para ver qué trabajo tuyo no está registrado:
    $ npx @skapxd/azure-devops-agent branches unlinked

Quién hace qué:
  consultar, buscar, actualizar, crear sin jerarquía →  az boards
  estados del workflow, crear con padre, etiquetar   →  boards
  ramas sin work item                                →  branches

Para reencontrar tu trabajo en un tablero heredado:
  Todo lo que se crea o modifica desde aquí queda con la etiqueta agent.
    $ az boards query -o table --wiql "SELECT [System.Id], [System.Title] \
        FROM WorkItems WHERE [System.TeamProject] = 'MiProyecto' \
        AND [System.Tags] CONTAINS 'agent'"

  El nombre del proyecto va literal: la macro @project no resuelve en
  az boards query y devuelve cero filas sin dar ningún error.
`;

export const EJEMPLO_TAG = `
Para qué sirve:
  Dejar huella en work items que ya existían, para que aparezcan en el mismo
  filtro que los creados desde aquí. Pensado para el tablero heredado: cientos
  de tareas asignadas y sin empezar, y tú solo quieres ver las que estás
  gestionando de verdad.

  az no sabe hacerlo. Su única vía es:
    az boards work-item update --id 11604 --fields "System.Tags=agent"
  y eso ASIGNA el campo entero: si el work item tenía etiquetas, las borra.
  Aquí se leen primero y se escribe la unión.

Ejemplo:
  $ npx @skapxd/azure-devops-agent boards tag 11604 11605 --format text

  #11604  qa, agent  (añadida)
  #11605  agent      (ya la tenía)

Después, para filtrar:
  az boards query -o table --wiql "SELECT [System.Id], [System.Title] \\
      FROM WorkItems WHERE [System.TeamProject] = 'MiProyecto' \\
      AND [System.Tags] CONTAINS 'agent'"

  Dos trampas, ambas silenciosas:

  - Pon el nombre del proyecto literal. La macro @project no resuelve en
    az boards query —ni pasando --project— y devuelve cero filas sin error.
  - CONTAINS sobre etiquetas compara la etiqueta ENTERA, no subcadenas: buscar
    "prioridad" no encuentra "prioridad 24". Por eso agent no colisiona con
    agente-comercial, pero tampoco vale escribir la etiqueta a medias.
`;
