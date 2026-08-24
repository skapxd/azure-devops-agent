---
name: azure-devops-workflow
description: Registra y consulta trabajo en Azure DevOps desde la terminal — crea historias, tareas hijas y bugs, los asigna, los transiciona y los enlaza con el código, usando el CLI @skapxd/azure-devops-agent. Detecta organización y proyecto solos, desde el git remote. Úsala siempre que aparezca trabajo sin registrar: una rama sin número de historia, un pendiente que el usuario menciona al pasar, deuda técnica, un TODO que quedará para después, un hallazgo de code review que no se corregirá ahora, o al cerrar algo para dejar el tablero al día. También cuando pregunten qué tienen asignado o en qué va una historia. No esperes a que digan "Azure DevOps" o "work item" — el trabajo se pierde justamente porque nadie se acuerda de nombrarlo.
---

# Trazabilidad en Azure DevOps

El tablero es la memoria del equipo: si algo no está ahí, para quien planifica y para quien llegue en seis meses ese trabajo no existió.

El problema rara vez es que la gente no sepa usar el tablero. Es que abrir el portal, buscar el proyecto, elegir el tipo, llenar campos y asignar cuesta varios minutos y rompe el foco, justo cuando la cabeza está en el código. Así que se posterga y se pierde.

**Tu trabajo es quitar esa fricción, no recordarle a nadie que la sufra.** Cuando detectes trabajo sin registrar, ofrécete a crear el work item tú mismo, con el título y la descripción ya redactados, para que la respuesta del usuario sea un sí y nada más.

## El CLI

Todo pasa por `@skapxd/azure-devops-agent`, que se ejecuta sin instalar nada:

```bash
pnpx @skapxd/azure-devops-agent <comando>
```

Deriva organización y proyecto del `git remote`, así que no preguntes por ellos. Empieza por aquí para saber dónde estás parado:

```bash
pnpx @skapxd/azure-devops-agent check
```

```
organización: MiOrg
proyecto:     MiProyecto
repositorio:  MiRepo
identidad:    persona@ejemplo.com
```

Si el remote no es de Azure DevOps, falla con un mensaje claro y esta skill no aplica — dilo y sigue con lo que el usuario estaba haciendo.

### Token

Hace falta un Personal Access Token en `AZURE_DEVOPS_EXT_PAT`. El CLI lo lee del entorno y, si no está ahí (habitual en shells no interactivos), del perfil de shell del sistema: en macOS y Linux `~/.zshrc`, `~/.bashrc`, `~/.profile`, `~/.zshenv` y `~/.bash_profile`; en Windows el `$PROFILE` de PowerShell y los perfiles de Git Bash.

Si no aparece, indica al usuario que genere uno en `https://dev.azure.com/<org>/_usersSettings/tokens` con permiso **Work Items (Read & Write)** y lo exporte en su perfil. Nunca intentes crear, adivinar ni imprimir el token.

## Cuándo intervenir

Una skill que interrumpe en cada mensaje termina desactivada, y entonces no sirve para nada. Propón donde el costo de olvidar es alto:

- **Rama sin historia asociada.** `boards orphans` las lista. Es el caso que más trabajo pierde: una rama sin número nace de un arreglo rápido, se mergea, y nunca deja rastro.
- **Hallazgos que no se corrigen ahora.** Una revisión que encuentra cinco cosas y arregla dos deja tres que se evaporan al cerrar la conversación.
- **Deuda técnica que tú mismo introduces.** Un workaround, un TODO, un script de migración temporal que alguien debe borrar después: nadie más sabe que existe.
- **Pendientes mencionados al pasar.** "Hay que revisar eso", "lleva fallando un tiempo", "algún día habría que migrarlo".

Cuándo **no**: cambios triviales, exploración que no deja pendientes, y cuando el usuario ya dijo que no. Una propuesta por tema; si dice que no, sigue sin insistir.

**Confirma antes de crear o modificar.** Un work item es visible para todo el equipo y notifica a quien se asigne. No es reversible sin ruido.

## Comandos

```bash
ado context [--json]              # organización, proyecto y repositorio
ado check                         # valida el token y muestra la identidad

ado boards types                  # tipos de work item del proyecto
ado boards states <tipo>          # estados reales del workflow de ese tipo
ado boards iteration              # ruta del sprint en curso
ado boards search <texto>         # busca por título
ado boards show <id>              # un work item con su padre y sus hijos
ado boards list --assignee <mail> # trabajo abierto de esa persona
ado boards orphans                # ramas locales sin work item asociado

ado boards create --type <tipo> --title <texto>
                  [--description <html>] [--parent <id>]
                  [--assign <correo>] [--iteration <ruta>]

ado boards update <id> [--state <estado>] [--assign <correo>] [--comment <texto>]
```

(`ado` es el binario; con `pnpx` se escribe `pnpx @skapxd/azure-devops-agent boards …`)

### Antes de crear

**Consulta el flujo, no lo asumas.** Los tipos y estados varían según la plantilla del proyecto y casi siempre están personalizados. Usar un estado que no existe falla; usar uno que existe pero significa otra cosa desordena el tablero de todos.

```bash
ado boards types
ado boards states "Product Backlog Item"
```

Muchos equipos añaden estados que reflejan su pipeline de ambientes ("Listo para QA", "En Pre-Prod"). Respeta esa semántica: suelen distinguir *esperando despliegue* de *desplegado y en validación*.

**Busca si ya existe.** Duplicar tickets hace tanto daño como no crearlos:

```bash
ado boards search "palabra clave"
```

### Crear con jerarquía

`--parent` cuelga el work item de su historia **en la misma llamada**:

```bash
ado boards create --type Task --title "Quitar el índice único" --parent 1234
```

Descomponer una historia en tareas es lo primero que se salta el equipo cuando va con prisa, y es lo que hace que el tablero refleje el avance real en vez de saltar de 0% a 100%. Si el usuario acaba de crear una historia con frentes claros (backend, frontend, pruebas), ofrécele crear las tareas de una vez.

`--description` se renderiza como **HTML**: usa `<br>`, `<ul><li>`, `<b>`. Los saltos de línea planos se pierden y el texto queda en un párrafo ilegible.

Para el sprint en curso, `ado boards iteration` y pásalo con `--iteration`. Si no hay sprint activo, omítelo: cae al backlog, que es lo correcto.

### Asignar

Se asigna por correo, y el del usuario actual sale de `ado check`. **No adivines el correo de otras personas**: si hay que asignar a alguien más y no lo sabes con certeza, pregunta — asignar al que no es le llega como notificación y ensucia su lista.

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
