---
name: azure-devops-workflow
description: Trabaja con Azure DevOps desde la terminal en cualquier repo alojado ahí — crea y actualiza work items (historias, tareas, bugs), consulta el tablero y enlaza el código con su ticket. Detecta la organización y el proyecto solos, desde el git remote. Úsala siempre que aparezca trabajo sin registrar: una rama sin número de historia, un pendiente que el usuario menciona al pasar, deuda técnica, un TODO que quedará para después, un hallazgo de code review que no se corregirá ahora, o al cerrar algo para dejar el tablero al día. También cuando pregunten qué tienen asignado, en qué va una historia, por qué falló un pipeline, o quieran enlazar una rama con su ticket. No esperes a que digan "Azure DevOps" o "work item" — el trabajo se pierde justamente porque nadie se acuerda de nombrarlo.
---

# Azure DevOps desde la terminal

El tablero es la memoria del equipo: si algo no está ahí, para quien planifica y para quien llegue en seis meses ese trabajo no existió.

El problema rara vez es que la gente no sepa usar el tablero. Es que abrir el portal, buscar el proyecto, elegir el tipo, llenar campos y asignar cuesta varios minutos y rompe el foco, justo cuando la cabeza está en el código. Así que se posterga y se pierde.

**Tu trabajo es quitar esa fricción, no recordarle a nadie que la sufra.** Cuando detectes trabajo sin registrar, ofrécete a crear el work item tú mismo, con el título y la descripción ya redactados, para que la respuesta del usuario sea un sí y nada más.

## Contexto del repositorio

No pidas la organización ni el proyecto: salen del `git remote`. El script incluido los deriva y carga el token:

```bash
node skills/azure-devops/scripts/ado-context.mjs check
```

```
organización: MiOrg
proyecto:     MiProyecto
repositorio:  MiRepo
identidad:    persona@ejemplo.com
```

El script es la única puerta al contexto y a las consultas de solo lectura, y funciona igual en macOS, Linux y Windows — solo necesita Node 18+ y git, sin `curl`, `python` ni bash:

| Comando | Devuelve |
|---|---|
| `context` | organización, proyecto y repositorio |
| `context --json` | lo mismo en JSON, para encadenar con otro proceso |
| `check` | además valida el token y muestra la identidad |
| `iteration` | ruta del sprint en curso (vacío si no hay) |
| `states <tipo>` | estados válidos de un tipo de work item |
| `types` | tipos de work item del proyecto |

Si el remote no es de Azure DevOps, el script falla con un mensaje claro y esta skill no aplica — dilo y sigue con lo que el usuario estaba haciendo.

### Token

La autenticación usa un Personal Access Token en `AZURE_DEVOPS_EXT_PAT`. El script lo busca en el entorno y, si no está (habitual en shells no interactivos), en `~/.zshrc`, `~/.bashrc`, `~/.profile` y `~/.zshenv`.

Si no aparece, indica al usuario que genere uno en `https://dev.azure.com/<org>/_usersSettings/tokens` con los permisos del área que vaya a usar, y lo exporte en su perfil. Nunca intentes crear, adivinar ni imprimir el token — al mostrar comandos, deja la variable sin expandir.

Muchas operaciones también funcionan con `az devops` tras `az login`; el PAT es lo que hace que funcionen sin sesión interactiva.

## Cuándo intervenir

El equilibrio importa: una skill que interrumpe en cada mensaje termina desactivada, y entonces no sirve para nada. Propón donde el costo de olvidar es alto:

- **Rama sin historia asociada.** Muchos equipos codifican el número en el nombre (`feat/1234-descripcion`, `area/4567/slug`). Cuando no hay número, o hay un marcador de "no aplica", ese trabajo no tiene nada en el tablero. Es el caso que más se pierde.
- **Hallazgos que no se corrigen ahora.** Una revisión que encuentra cinco cosas y arregla dos deja tres que se evaporan al cerrar la conversación. Esas tres son justamente lo que debe quedar registrado.
- **Deuda técnica que tú mismo introduces.** Un workaround, un TODO, un script de migración temporal que alguien debe borrar después: nadie más sabe que existe.
- **Pendientes que el usuario menciona al pasar.** "Hay que revisar eso", "lleva fallando un tiempo", "algún día habría que migrarlo".

Cuándo **no**: cambios triviales, exploración o depuración que no deja pendientes, y cuando el usuario ya dijo que no. Una propuesta por tema; si dice que no, sigue sin insistir.

**Confirma antes de crear o modificar.** Un work item es visible para todo el equipo y notifica a quien se asigne. No es reversible sin ruido.

## Áreas

Azure DevOps son varios productos bajo un mismo techo. Lee el archivo del área que necesites en vez de cargarlas todas — cada uno trae los comandos y las trampas de su parte:

| Área | Archivo | Para qué |
|---|---|---|
| **Boards** | `references/boards.md` | Work items: crear historias, tareas y bugs, jerarquía padre-hijo, asignar, transicionar, consultar con WiQL, comentar |

Áreas aún no cubiertas: Pipelines (builds, releases, logs de fallos), Repos (pull requests, políticas) y Wiki. Si el usuario pide algo de esas áreas, dilo con franqueza y resuelve con `az devops`/REST directamente en vez de improvisar instrucciones que no están validadas.

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

Escribe en el idioma del tablero. Si los work items existentes están en español, sigue en español.

## Convenciones propias del equipo

Cada equipo tiene las suyas: cómo se nombran las ramas, quién revisa, qué estado significa qué. Esta skill no las conoce y no debe inventarlas.

Si el repo tiene un `CLAUDE.md`, `AGENTS.md` o similar con esas reglas, léelo y respétalo — manda sobre lo que dice aquí. Si no lo tiene y el usuario te corrige sobre una convención, ofrécele dejarla escrita ahí: es la forma de que la próxima vez ya la sepas, y de que la sepa el resto del equipo.
