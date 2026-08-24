---
name: azure-devops-workflow
description: Registra y consulta trabajo en Azure DevOps desde la terminal — crea historias, tareas hijas y bugs, los asigna, los transiciona y los enlaza con el código, usando az boards y el CLI @skapxd/azure-devops-agent para lo que az no cubre. Úsala siempre que aparezca trabajo sin registrar: una rama sin número de historia, un pendiente que el usuario menciona al pasar, deuda técnica, un TODO que quedará para después, un hallazgo de code review que no se corregirá ahora, o al cerrar algo para dejar el tablero al día. También cuando pregunten qué tienen asignado o en qué va una historia. No esperes a que digan "Azure DevOps" o "work item" — el trabajo se pierde justamente porque nadie se acuerda de nombrarlo.
---

# Trazabilidad en Azure DevOps

El tablero es la memoria del equipo: si algo no está ahí, para quien planifica y para quien llegue en seis meses ese trabajo no existió.

El problema rara vez es que la gente no sepa usar el tablero. Es que abrir el portal, buscar el proyecto, elegir el tipo, llenar campos y asignar cuesta varios minutos y rompe el foco, justo cuando la cabeza está en el código. Así que se posterga y se pierde.

**Tu trabajo es quitar esa fricción, no recordarle a nadie que la sufra.** Cuando detectes trabajo sin registrar, ofrécete a crear el work item tú mismo, con el título y la descripción ya redactados, para que la respuesta del usuario sea un sí y nada más.

## Dos herramientas, cada una en lo suyo

**`az boards`** (extensión `azure-devops` de Azure CLI) hace la mayor parte: consultar, crear, actualizar, buscar. Es la herramienta por defecto.

**`@skapxd/azure-devops-agent`** cubre solo tres huecos que `az` deja:

| Necesidad | Comando |
|---|---|
| Saber org, proyecto e identidad de este repo | `ado context --json` |
| Estados válidos de un tipo de work item | `ado boards states "<tipo>"` |
| Crear un work item **ya colgado** de su padre | `ado boards create --parent <id> …` |
| Ramas sin work item asociado | `ado boards orphans` |

Se ejecuta sin instalar nada:

```bash
pnpx @skapxd/azure-devops-agent <comando>
```

Si algo se puede hacer con `az boards`, hazlo con `az boards`.

## Empieza por el contexto

```bash
pnpx @skapxd/azure-devops-agent context --json
```

```json
{
  "org": "MiOrg",
  "project": "MiProyecto",
  "repo": "MiRepo",
  "orgUrl": "https://dev.azure.com/MiOrg",
  "identity": "persona@ejemplo.com"
}
```

De ahí salen el `--org` y el `--project` que pide `az`, y la identidad para asignar sin adivinar correos. Todo se deriva del `git remote`, así que no preguntes por ello.

Si el remote no es de Azure DevOps, falla con un mensaje claro y esta skill no aplica — dilo y sigue con lo que el usuario estaba haciendo.

### Token

Hace falta un Personal Access Token en `AZURE_DEVOPS_EXT_PAT` con permiso **Work Items (Read & Write)**, generado en `https://dev.azure.com/<org>/_usersSettings/tokens`. Lo usan tanto `az` como el CLI.

Se lee del entorno y, si no está ahí (habitual en shells no interactivos), del perfil de shell del sistema: en macOS y Linux `~/.zshrc`, `~/.bashrc`, `~/.profile`, `~/.zshenv` y `~/.bash_profile`; en Windows el `$PROFILE` de PowerShell y los perfiles de Git Bash. Nunca intentes crear, adivinar ni imprimir el token.

## Cuándo intervenir

Una skill que interrumpe en cada mensaje termina desactivada, y entonces no sirve para nada. Propón donde el costo de olvidar es alto:

- **Rama sin historia asociada.** `ado boards orphans` las lista. Es el caso que más trabajo pierde: una rama sin número nace de un arreglo rápido, se mergea, y nunca deja rastro.
- **Hallazgos que no se corrigen ahora.** Una revisión que encuentra cinco cosas y arregla dos deja tres que se evaporan al cerrar la conversación.
- **Deuda técnica que tú mismo introduces.** Un workaround, un TODO, un script de migración temporal que alguien debe borrar después: nadie más sabe que existe.
- **Pendientes mencionados al pasar.** "Hay que revisar eso", "lleva fallando un tiempo", "algún día habría que migrarlo".

Cuándo **no**: cambios triviales, exploración que no deja pendientes, y cuando el usuario ya dijo que no. Una propuesta por tema; si dice que no, sigue sin insistir.

**Confirma antes de crear o modificar.** Un work item es visible para todo el equipo y notifica a quien se asigne. No es reversible sin ruido.

## Antes de crear

**Consulta el flujo, no lo asumas.** Los tipos y estados varían según la plantilla del proyecto y casi siempre están personalizados. Usar un estado que no existe falla; usar uno que existe pero significa otra cosa desordena el tablero de todos.

```bash
az boards work-item type list --org <org-url> --project <proyecto> -o table
pnpx @skapxd/azure-devops-agent boards states "Product Backlog Item"
```

Muchos equipos añaden estados que reflejan su pipeline de ambientes ("Listo para QA", "En Pre-Prod"). Respeta esa semántica: suelen distinguir *esperando despliegue* de *desplegado y en validación*.

**Busca si ya existe.** Duplicar tickets hace tanto daño como no crearlos:

```bash
az boards query --org <org-url> --project <proyecto> -o table \
  --wiql "SELECT [System.Id], [System.Title] FROM WorkItems \
WHERE [System.TeamProject] = @project AND [System.Title] CONTAINS 'palabra' \
AND [System.ChangedDate] > @today - 120"
```

## Crear

**Sin padre**, con `az`:

```bash
az boards work-item create --type Bug --title "..." --description "<b>Pasos</b>…" \
  --org <org-url> --project <proyecto>
```

**Colgado de una historia**, con el CLI — en una sola llamada:

```bash
pnpx @skapxd/azure-devops-agent boards create \
  --type Task --title "Quitar el índice único" --parent 1234 \
  --assign persona@ejemplo.com --iteration "MiProyecto\Sprint 95"
```

Esto último es el hueco de `az`: allí son dos comandos (`work-item create` y luego `relation add`), y un fallo entre ambos deja un work item huérfano que nadie sabe de dónde salió.

Descomponer una historia en tareas es lo primero que se salta el equipo cuando va con prisa, y es lo que hace que el tablero refleje el avance real en vez de saltar de 0% a 100%. Si el usuario acaba de crear una historia con frentes claros (backend, frontend, pruebas), ofrécele crear las tareas de una vez.

`--description` se renderiza como **HTML**: usa `<br>`, `<ul><li>`, `<b>`. Los saltos de línea planos se pierden y el texto queda en un párrafo ilegible.

Para el sprint en curso, `az boards iteration project list --org <org-url> --project <proyecto>`. Si no hay sprint activo, omite `--iteration`: cae al backlog, que es lo correcto.

## Actualizar y consultar

Todo con `az`:

```bash
az boards work-item show   --id <id> --org <org-url>
az boards work-item update --id <id> --state "In Progress" --org <org-url>
az boards work-item update --id <id> --assigned-to persona@ejemplo.com --org <org-url>
az boards work-item update --id <id> --discussion "Desplegado en el build 123." --org <org-url>
```

Se asigna por correo, y el del usuario actual sale de `ado context`. **No adivines el correo de otras personas**: si hay que asignar a alguien más y no lo sabes con certeza, pregunta — asignar al que no es le llega como notificación y ensucia su lista.

Evita `@Me` en WiQL: resuelve a la identidad del token, que no siempre es la cuenta con la que el usuario trabaja en el portal. Si una consulta con `@Me` devuelve cero pero el usuario insiste en que tiene trabajo asignado, es casi seguro eso — usa el correo explícito antes de concluir que no tiene nada.

Un comentario al cerrar, con el número de build o el commit, ahorra la arqueología de meses después.

## Enlazar el código con su ticket

Azure DevOps asocia commits y pull requests automáticamente cuando el mensaje incluye `#<id>`:

```
fix(auth): corregir expiración del token #12345
```

Es la trazabilidad más barata que existe y no cuesta nada al escribir. Cuando ayudes a redactar un mensaje de commit y conozcas el work item, incluye la referencia.

Si el trabajo nació en una rama sin número y luego se le creó el work item, la rama ya no se puede renombrar sin romper referencias — pero el `#id` en los commits siguientes sí conecta las dos puntas.

## Redactar para que se entienda dentro de seis meses

El título se lee en una lista de cientos. "Corregir bug" o "Ajustes varios" no le dicen nada a nadie; "El login resuelve la cuenta equivocada cuando hay dominios duplicados" sí. Di qué pasa, no dónde.

En la descripción prioriza lo que no es obvio leyendo el código: por qué importa, qué se rompe si no se hace, qué se decidió y qué se descartó. El cómo ya está en el diff.

Para un bug, la descripción vale por lo reproducible que sea: pasos, resultado esperado, resultado actual. Si salió de una revisión de código, cita `archivo:línea`.

Escribe en el idioma del tablero. Si los work items existentes están en español, sigue en español.

## Convenciones propias del equipo

Cada equipo tiene las suyas: cómo se nombran las ramas, quién revisa, qué estado significa qué. Esta skill no las conoce y no debe inventarlas.

Si el repo tiene un `CLAUDE.md`, `AGENTS.md` o similar con esas reglas, léelo y respétalo — manda sobre lo que dice aquí. Si no lo tiene y el usuario te corrige sobre una convención, ofrécele dejarla escrita ahí: es la forma de que la próxima vez ya la sepas, y de que la sepa el resto del equipo.
