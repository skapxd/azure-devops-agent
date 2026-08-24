---
name: azure-boards
description: Registra en Azure Boards el trabajo que se hace en un repo de Azure DevOps — crea work items (historias, tareas hijas, bugs), los asigna, los transiciona y los enlaza con commits, todo desde la terminal. Detecta la organización y el proyecto solo, desde el git remote. Úsala siempre que aparezca trabajo sin work item detrás: una rama sin número de historia, un pendiente que el usuario menciona al pasar, deuda técnica, un TODO que quedará para después, un hallazgo de code review que no se va a corregir ahora, o al cerrar una tarea para dejar el tablero al día. También cuando pregunten qué tienen asignado o en qué va una historia. No esperes a que digan "Azure DevOps" o "work item" — el trabajo se pierde justamente porque nadie se acuerda de nombrarlo.
---

# Trazabilidad en Azure Boards

El tablero es la memoria del equipo: si algo no está ahí, para quien planifica y para quien llegue en seis meses ese trabajo no existió.

El problema rara vez es que la gente no sepa usar el tablero. Es que abrir el portal, buscar el proyecto, elegir el tipo, llenar campos y asignar cuesta varios minutos y rompe el foco, justo cuando la cabeza está en el código. Así que se posterga y se pierde.

**Tu trabajo es quitar esa fricción, no recordarle a nadie que la sufra.** Cuando detectes trabajo sin registrar, ofrécete a crear el work item tú mismo, con el título y la descripción ya redactados, para que la respuesta del usuario sea un sí y nada más.

## Contexto del repositorio

No pidas la organización ni el proyecto: salen del `git remote`. El script incluido los deriva y carga el token:

```bash
bash skills/azure-boards/scripts/ado-context.sh --check
```

```
organización: MiOrg
proyecto:     MiProyecto
repositorio:  MiRepo
identidad:    persona@ejemplo.com
```

Dentro de un script, cárgalo con `source` para tener `$ADO_ORG`, `$ADO_PROJECT`, `$ADO_REPO`, `$ADO_ORG_URL` y las funciones `ado_load_pat` y `ado_auth_header`.

Si el remote no es de Azure DevOps, el script falla con un mensaje claro y esta skill no aplica — dilo y sigue con lo que el usuario estaba haciendo.

### Token

La autenticación usa un Personal Access Token en `AZURE_DEVOPS_EXT_PAT`. El script lo busca en el entorno y, si no está (habitual en shells no interactivos), en `~/.zshrc`, `~/.bashrc`, `~/.profile` y `~/.zshenv`.

Si no aparece, indica al usuario que genere uno en `https://dev.azure.com/<org>/_usersSettings/tokens` con permiso **Work Items (Read & Write)** y lo exporte en su perfil. Nunca intentes crear, adivinar ni imprimir el token — al mostrar comandos, deja la variable sin expandir.

## Cuándo proponer un work item

El equilibrio importa: una skill que interrumpe en cada mensaje termina desactivada, y entonces no sirve para nada. Propón donde el costo de olvidar es alto:

- **Rama sin historia asociada.** Muchos equipos codifican el número en el nombre (`feat/1234-descripcion`, `area/4567/slug`). Cuando no hay número, o hay un marcador de "no aplica", ese trabajo no tiene nada en el tablero. Es el caso que más se pierde.
- **Hallazgos que no se corrigen ahora.** Una revisión que encuentra cinco cosas y arregla dos deja tres que se evaporan al cerrar la conversación. Esas tres son justamente lo que debe quedar registrado.
- **Deuda técnica que tú mismo introduces.** Un workaround, un TODO, un script de migración temporal que alguien debe borrar después: nadie más sabe que existe.
- **Pendientes que el usuario menciona al pasar.** "Hay que revisar eso", "lleva fallando un tiempo", "algún día habría que migrarlo".

Cuándo **no**: cambios triviales, exploración o depuración que no deja pendientes, y cuando el usuario ya dijo que no. Una propuesta por tema; si dice que no, sigue sin insistir.

**Confirma antes de crear.** Un work item es visible para todo el equipo y notifica a quien se asigne. No es reversible sin ruido.

## Descubrir el flujo del proyecto

Los tipos y estados varían según la plantilla (Agile, Scrum, CMMI) y casi siempre están personalizados. **No asumas los estados: consúltalos.** Usar un estado que no existe falla, y usar uno que existe pero significa otra cosa desordena el tablero de todos.

Tipos disponibles:

```bash
az boards work-item type list --org "$ADO_ORG_URL" --project "$ADO_PROJECT" -o table
```

Estados válidos de un tipo (aquí `Task`; URL-encodea los espacios, p. ej. `Product%20Backlog%20Item`):

```bash
curl -s -H "$(ado_auth_header)" \
  "$ADO_ORG_URL/$ADO_PROJECT/_apis/wit/workitemtypes/Task/states?api-version=7.0" \
  | python3 -c "import json,sys; print(' → '.join(s['name'] for s in json.load(sys.stdin)['value']))"
```

Muchos equipos añaden estados que reflejan su pipeline de ambientes ("Listo para QA", "En Pre-Prod"). Cuando los veas, respeta esa semántica: suelen distinguir *esperando despliegue* de *desplegado y en validación*.

Como referencia general, sin darlo por hecho: **historia/PBI/User Story** para valor de negocio, **Task** para trabajo técnico o subtareas, **Bug** para algo que ya está desplegado y falla, **Impediment/Issue** para bloqueos.

## Comandos

Todos asumen `$ADO_ORG_URL` y `$ADO_PROJECT` ya cargados.

### Crear

```bash
az boards work-item create \
  --title "Título específico y buscable" \
  --type "Task" \
  --description "Descripción en HTML." \
  --org "$ADO_ORG_URL" --project "$ADO_PROJECT" \
  --query id -o tsv
```

`--description` se renderiza como **HTML**: usa `<br>`, `<ul><li>`, `<b>`. Los saltos de línea planos se pierden y el texto queda en un párrafo ilegible.

Para ubicarlo en el sprint en curso, consúltalo en vez de asumirlo:

```bash
curl -s -H "$(ado_auth_header)" \
  "$ADO_ORG_URL/$ADO_PROJECT/_apis/work/teamsettings/iterations?api-version=7.0&\$timeframe=current" \
  | python3 -c "import json,sys; v=json.load(sys.stdin)['value']; print(v[0]['path'] if v else '')"
```

y pásalo con `--iteration "<path>"`. Si no hay sprint activo, omite el parámetro: cae al backlog, que es lo correcto.

### Jerarquía padre-hijo

Crear la tarea y colgarla de su historia son dos pasos:

```bash
ID=$(az boards work-item create --title "..." --type Task \
  --org "$ADO_ORG_URL" --project "$ADO_PROJECT" --query id -o tsv)

az boards work-item relation add --id "$ID" --relation-type parent \
  --target-id <ID_HISTORIA> --org "$ADO_ORG_URL"
```

`--relation-type parent` significa "el target es mi padre".

Descomponer una historia en tareas es lo primero que se salta el equipo cuando va con prisa, y es lo que hace que el tablero refleje el avance real en vez de saltar de 0% a 100%. Si el usuario acaba de crear una historia con frentes claros (backend, frontend, pruebas), ofrécele crear las tareas de una vez.

### Asignar, transicionar, comentar

```bash
az boards work-item update --id <ID> --assigned-to "persona@ejemplo.com" --org "$ADO_ORG_URL"
az boards work-item update --id <ID> --state "In Progress"           --org "$ADO_ORG_URL"
az boards work-item update --id <ID> --discussion "Desplegado en el build 123." --org "$ADO_ORG_URL"
```

Se asigna por correo. El del usuario actual sale de `ado-context.sh --check`. **No adivines el correo de otras personas**: si hay que asignar a alguien más y no lo sabes con certeza, pregunta — asignar al que no es le llega como notificación y ensucia su lista.

Un comentario al cerrar, con el número de build o el commit, ahorra la arqueología de meses después.

### Consultar

```bash
az boards query --wiql "SELECT [System.Id], [System.Title], [System.State] FROM WorkItems \
WHERE [System.TeamProject] = '$ADO_PROJECT' \
AND [System.AssignedTo] = 'persona@ejemplo.com' \
AND [System.State] NOT IN ('Done','Closed','Removed') \
ORDER BY [System.ChangedDate] DESC" \
  --org "$ADO_ORG_URL" --project "$ADO_PROJECT" -o table
```

Evita `@Me` en WiQL: resuelve a la identidad del token, que no siempre es la cuenta con la que el usuario trabaja en el portal. Si una consulta con `@Me` devuelve cero pero el usuario insiste en que tiene trabajo asignado, es casi seguro eso — usa el correo explícito antes de concluir que no tiene nada.

Ver uno concreto:

```bash
az boards work-item show --id <ID> --org "$ADO_ORG_URL"
```

## Enlazar commits con su work item

Azure DevOps asocia commits y pull requests automáticamente cuando el mensaje incluye `#<id>`:

```
fix(auth): corregir expiración del token #12345
```

Es la trazabilidad más barata que existe y no cuesta nada al escribir. Cuando ayudes a redactar un mensaje de commit y conozcas el work item, incluye la referencia.

Si el trabajo nació en una rama sin número y luego se le creó el work item, la rama ya no se puede renombrar sin romper referencias — pero el `#id` en los commits siguientes sí conecta las dos puntas.

## Redactar títulos y descripciones

El título se lee en una lista de cientos. "Corregir bug" o "Ajustes varios" no le dicen nada a nadie dentro de tres meses; "El login resuelve la cuenta equivocada cuando hay dominios duplicados" sí. Di qué pasa, no dónde.

En la descripción prioriza lo que no es obvio leyendo el código: por qué importa, qué se rompe si no se hace, qué se decidió y qué se descartó. El cómo ya está en el diff.

Para un bug, la descripción vale por lo reproducible que sea: pasos, resultado esperado, resultado actual. Si salió de una revisión de código, cita `archivo:línea`.

Escribe en el idioma del tablero. Si los work items existentes están en español, sigue en español.

## Convenciones propias del equipo

Cada equipo tiene las suyas: cómo se nombran las ramas, quién revisa, qué estado significa qué. Esta skill no las conoce y no debe inventarlas.

Si el repo tiene un `CLAUDE.md`, `AGENTS.md` o similar con esas reglas, léelo y respétalo — manda sobre lo que dice aquí. Si no lo tiene y el usuario te corrige sobre una convención, ofrécele dejarla escrita ahí: es la forma de que la próxima vez ya la sepas, y de que la sepa el resto del equipo.
