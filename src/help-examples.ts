/**
 * Ejemplos que Commander añade al final del `--help` de cada comando.
 *
 * Una descripción dice qué hace un comando; un ejemplo con su salida real dice
 * para qué sirve y qué esperar. Es la diferencia entre "estados válidos del
 * workflow" y ver la lista numerada que devuelve.
 */

export const EJEMPLO_STATES = `
Para qué sirve:
  Antes de mover un ticket, saber a qué estados puedes moverlo. Cada proyecto
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

export const EJEMPLO_ORPHANS = `
Para qué sirve:
  Encontrar el trabajo que se está perdiendo. Una rama sin número de historia
  nace de un arreglo rápido, se mergea, y no deja rastro en el tablero.

Ejemplo:
  $ npx @skapxd/azure-devops-agent boards orphans

  **2 ramas sin work item asociado:**

  - \`fix/ajuste-rapido\`
  - \`back/n-a/duplicar-concesionarios\`

  Reconoce el número en cualquier posición del nombre, así que
  feat/1234-algo y back/1234/algo cuentan como asociadas.
`;

export const EJEMPLO_CREATE = `
Para qué sirve:
  Colgar una tarea de su historia sin dejar cabos sueltos. En az son dos pasos
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
    $ npx @skapxd/azure-devops-agent boards orphans

Reparto de tareas:
  consultar, buscar, actualizar, crear sin jerarquía   →  az boards
  estados del workflow, ramas huérfanas, crear con padre  →  ado
`;
