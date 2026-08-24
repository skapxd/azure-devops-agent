# Azure Boards — work items

Referencia del área de Boards. El contexto del repositorio, el token y el criterio de cuándo intervenir están en `SKILL.md`; aquí solo va la mecánica.

Para las consultas de solo lectura usa `ado-context.mjs`: funciona igual en Windows, macOS y Linux. Para crear y actualizar se usa `az boards`, que ya es multiplataforma.

Los ejemplos escriben `<org-url>` y `<proyecto>`; sácalos de `node ado-context.mjs context`.

## Descubrir el flujo del proyecto

Los tipos y estados varían según la plantilla (Agile, Scrum, CMMI) y casi siempre están personalizados. **No asumas los estados: consúltalos.** Usar uno que no existe falla, y usar uno que existe pero significa otra cosa desordena el tablero de todos.

Tipos disponibles:

```bash
node skills/azure-devops/scripts/ado-context.mjs types
```

Estados válidos de un tipo:

```bash
node skills/azure-devops/scripts/ado-context.mjs states "Product Backlog Item"
```

Muchos equipos añaden estados que reflejan su pipeline de ambientes ("Listo para QA", "En Pre-Prod"). Cuando los veas, respeta esa semántica: suelen distinguir *esperando despliegue* de *desplegado y en validación*.

Como referencia general, sin darlo por hecho: **historia/PBI/User Story** para valor de negocio, **Task** para trabajo técnico o subtareas, **Bug** para algo ya desplegado que falla, **Impediment/Issue** para bloqueos.

## Crear

```bash
az boards work-item create \
  --title "Título específico y buscable" \
  --type "Task" \
  --description "Descripción en HTML." \
  --org <org-url> --project <proyecto> \
  --query id -o tsv
```

`--description` se renderiza como **HTML**: usa `<br>`, `<ul><li>`, `<b>`. Los saltos de línea planos se pierden y el texto queda en un párrafo ilegible.

Para ubicarlo en el sprint en curso, consúltalo en vez de asumirlo:

```bash
node skills/azure-devops/scripts/ado-context.mjs iteration
```

y pásalo con `--iteration "<path>"`. Si no hay sprint activo, omite el parámetro: cae al backlog, que es lo correcto.

## Jerarquía padre-hijo

Crear la tarea y colgarla de su historia son dos pasos:

```bash
ID=$(az boards work-item create --title "..." --type Task \
  --org <org-url> --project <proyecto> --query id -o tsv)

az boards work-item relation add --id "$ID" --relation-type parent \
  --target-id <ID_HISTORIA> --org <org-url>
```

`--relation-type parent` significa "el target es mi padre".

Descomponer una historia en tareas es lo primero que se salta el equipo cuando va con prisa, y es lo que hace que el tablero refleje el avance real en vez de saltar de 0% a 100%. Si el usuario acaba de crear una historia con frentes claros (backend, frontend, pruebas), ofrécele crear las tareas de una vez.

Para verificar que la jerarquía quedó bien:

```bash
az boards work-item show --id <ID_HISTORIA> --org <org-url> --query "relations[?rel=='System.LinkTypes.Hierarchy-Forward'].url" -o tsv
```

## Asignar, transicionar, comentar

```bash
az boards work-item update --id <ID> --assigned-to "persona@ejemplo.com" --org <org-url>
az boards work-item update --id <ID> --state "In Progress"                --org <org-url>
az boards work-item update --id <ID> --discussion "Desplegado en el build 123." --org <org-url>
```

Se asigna por correo. El del usuario actual sale de `node ado-context.mjs check`. **No adivines el correo de otras personas**: si hay que asignar a alguien más y no lo sabes con certeza, pregunta — asignar al que no es le llega como notificación y ensucia su lista.

Un comentario al cerrar, con el número de build o el commit, ahorra la arqueología de meses después.

## Consultar

```bash
az boards query --wiql "SELECT [System.Id], [System.Title], [System.State] FROM WorkItems \
WHERE [System.TeamProject] = '<proyecto>' \
AND [System.AssignedTo] = 'persona@ejemplo.com' \
AND [System.State] NOT IN ('Done','Closed','Removed') \
ORDER BY [System.ChangedDate] DESC" \
  --org <org-url> --project <proyecto> -o table
```

Evita `@Me` en WiQL: resuelve a la identidad del token, que no siempre es la cuenta con la que el usuario trabaja en el portal. Si una consulta con `@Me` devuelve cero pero el usuario insiste en que tiene trabajo asignado, es casi seguro eso — usa el correo explícito antes de concluir que no tiene nada.

Antes de crear algo, vale la pena buscar si ya existe. Duplicar tickets es tan dañino como no crearlos:

```bash
az boards query --wiql "SELECT [System.Id], [System.Title] FROM WorkItems \
WHERE [System.TeamProject] = '<proyecto>' \
AND [System.Title] CONTAINS 'palabra clave' \
AND [System.ChangedDate] > @today - 120" \
  --org <org-url> --project <proyecto> -o table
```

Ver uno concreto:

```bash
az boards work-item show --id <ID> --org <org-url>
```

## Redactar bugs

La descripción de un bug vale por lo reproducible que sea: pasos, resultado esperado, resultado actual. Si salió de una revisión de código, cita `archivo:línea` — quien lo tome no debería tener que buscar dónde está el problema.
