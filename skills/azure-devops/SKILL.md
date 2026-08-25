---
name: azure-devops-workflow
description: Registra y consulta trabajo en Azure DevOps desde la terminal — crea work items y los cuelga de su padre, los asigna, los transiciona, los enlaza con el código y los marca con la etiqueta agent para poder reencontrarlos después, usando az boards y el CLI @skapxd/azure-devops-agent para lo que az no cubre. Úsala siempre que aparezca trabajo sin registrar — una rama sin número de work item, un pendiente que el usuario menciona al pasar, deuda técnica, un TODO que quedará para después, un hallazgo de code review que no se corregirá ahora, o al cerrar algo para dejar el tablero al día. También cuando pregunten qué tienen asignado o en qué va un work item. No esperes a que digan "Azure DevOps" o "work item" — el trabajo se pierde justamente porque nadie se acuerda de nombrarlo.
---

# Trazabilidad en Azure DevOps

El tablero es la memoria del equipo: si algo no está ahí, para quien planifica y para quien llegue en seis meses ese trabajo no existió.

El problema rara vez es que la gente no sepa usar el tablero. Es que abrir el portal, buscar el proyecto, elegir el tipo, llenar campos y asignar cuesta varios minutos y rompe el foco, justo cuando la cabeza está en el código. Así que se posterga y se pierde.

**Tu trabajo es quitar esa fricción, no recordarle a nadie que la sufra.** Cuando detectes trabajo sin registrar, ofrécete a crear el work item tú mismo, con el título y la descripción ya redactados, para que la respuesta del usuario sea un sí y nada más.

## Dos herramientas, cada una en lo suyo

**`az boards`** (extensión `azure-devops` de Azure CLI) hace la mayor parte: consultar, crear, actualizar, buscar. Es la herramienta por defecto.

**No hay que configurarle nada.** `az` detecta la organización y el proyecto del `git remote` de la carpeta donde estés. Para ver cuál está usando:

```bash
az repos list --query "[0].project.name" -o tsv
```

**`@skapxd/azure-devops-agent`** cubre solo tres huecos que `az` deja:

| Necesidad | Comando |
|---|---|
| Estados válidos de un tipo de work item | `npx @skapxd/azure-devops-agent boards states "<tipo>"` |
| Crear un work item **ya colgado** de su padre | `npx @skapxd/azure-devops-agent boards create --parent <id> …` |
| Añadir una etiqueta **sin borrar** las que ya tiene | `… boards tag <id> [<id>…]` |
| Ramas de git sin work item asociado | `… branches unlinked` |

Se ejecuta sin instalar nada:

```bash
pnpx @skapxd/azure-devops-agent <comando>
```

Todos aceptan `--format <markdown|json|text>`. Cuando los ejecutas tú, la salida llega en markdown porque va por una tubería, no a una terminal — así que puedes leerla y citarla directamente. Usa `--format json` cuando necesites extraer un campo concreto.

Si algo se puede hacer con `az boards`, hazlo con `az boards`.

Si el repo no es de Azure DevOps, `az` lo dirá y esta skill no aplica — dilo y sigue con lo que el usuario estaba haciendo.

### Token

Hace falta un Personal Access Token en `AZURE_DEVOPS_EXT_PAT` con permiso **Work Items (Read & Write)**, generado en `https://dev.azure.com/<org>/_usersSettings/tokens`. Lo usan tanto `az` como el CLI.

Se lee del entorno y, si no está ahí (habitual en shells no interactivos), del perfil de shell del sistema: en macOS y Linux `~/.zshrc`, `~/.bashrc`, `~/.profile`, `~/.zshenv` y `~/.bash_profile`; en Windows el `$PROFILE` de PowerShell y los perfiles de Git Bash. Nunca intentes crear, adivinar ni imprimir el token.

## Cuándo intervenir

Una skill que interrumpe en cada mensaje termina desactivada, y entonces no sirve para nada. Propón donde el costo de olvidar es alto:

- **Rama sin work item asociado.** `npx @skapxd/azure-devops-agent branches unlinked` las lista. Es el caso que más trabajo pierde: una rama sin número nace de un arreglo rápido, se mergea, y nunca deja rastro.
- **Hallazgos que no se corrigen ahora.** Una revisión que encuentra cinco cosas y arregla dos deja tres que se evaporan al cerrar la conversación.
- **Deuda técnica que tú mismo introduces.** Un workaround, un TODO, un script de migración temporal que alguien debe borrar después: nadie más sabe que existe.
- **Pendientes mencionados al pasar.** "Hay que revisar eso", "lleva fallando un tiempo", "algún día habría que migrarlo".

Cuándo **no**: cambios triviales, exploración que no deja pendientes, y cuando el usuario ya dijo que no. Una propuesta por tema; si dice que no, sigue sin insistir.

**Confirma antes de crear o modificar.** Un work item es visible para todo el equipo y notifica a quien se asigne. No es reversible sin ruido.

## Antes de crear

**Consulta el flujo, no lo asumas.** Los tipos y estados varían según la plantilla del proyecto y casi siempre están personalizados. Usar un estado que no existe falla; usar uno que existe pero significa otra cosa desordena el tablero de todos.

```bash
az boards work-item type list -o table
pnpx @skapxd/azure-devops-agent boards states "Product Backlog Item"
```

Muchos equipos añaden estados que reflejan su pipeline de ambientes ("Listo para QA", "En Pre-Prod"). Respeta esa semántica: suelen distinguir *esperando despliegue* de *desplegado y en validación*.

**Busca si ya existe.** Duplicar work items hace tanto daño como no crearlos:

```bash
az boards query -o table \
  --wiql "SELECT [System.Id], [System.Title] FROM WorkItems \
WHERE [System.TeamProject] = 'MiProyecto' AND [System.Title] CONTAINS 'palabra' \
AND [System.ChangedDate] > @today - 120"
```

## Crear

**Sin padre**, con `az`:

```bash
az boards work-item create --type Bug --title "..." --description "<b>Pasos</b>…"
```

**Colgado de un padre**, con el CLI — en una sola llamada:

```bash
pnpx @skapxd/azure-devops-agent boards create \
  --type Task --title "Quitar el índice único" --parent 1234 \
  --assign persona@ejemplo.com --iteration "MiProyecto\Sprint 95"
```

Esto último es el hueco de `az`: allí son dos comandos (`work-item create` y luego `relation add`), y un fallo entre ambos deja un work item huérfano que nadie sabe de dónde salió.

Descomponer un work item en otros más pequeños es lo primero que se salta el equipo cuando va con prisa, y es lo que hace que el tablero refleje el avance real en vez de saltar de 0% a 100%. Si el usuario acaba de crear un work item con frentes claros (backend, frontend, pruebas), ofrécele crear los hijos de una vez.

`--description` se renderiza como **HTML**: usa `<br>`, `<ul><li>`, `<b>`. Los saltos de línea planos se pierden y el texto queda en un párrafo ilegible.

Para el sprint en curso, `az boards iteration project list`. Si no hay sprint activo, omite `--iteration`: cae al backlog, que es lo correcto.

## Actualizar y consultar

Todo con `az`:

```bash
az boards work-item show   --id <id>
az boards work-item update --id <id> --state "In Progress"
az boards work-item update --id <id> --assigned-to persona@ejemplo.com
az boards work-item update --id <id> --discussion "Desplegado en el build 123."
```

Se asigna por correo. Si el `CLAUDE.md` del repo no dice cuál es el del usuario, pregúntaselo una vez y ofrécele dejarlo escrito ahí. **No adivines el correo de otras personas**: si hay que asignar a alguien más y no lo sabes con certeza, pregunta — asignar al que no es le llega como notificación y ensucia su lista.

**Para "¿qué tengo asignado?", usa `@Me`**, no el correo:

```bash
az boards query -o table --wiql "SELECT [System.Id], [System.Title], [System.State] \
FROM WorkItems WHERE [System.TeamProject] = 'MiProyecto' \
AND [System.AssignedTo] = @Me AND [System.State] <> 'Done'"
```

`@Me` resuelve a la identidad del PAT, y el PAT es de la persona que está
trabajando: son la misma. Verificado — `@Me` y el correo real devuelven
exactamente las mismas filas.

Escribir el correo a mano es peor, y de forma traicionera: en Azure DevOps la
identidad va por el correo de la cuenta **de esa organización**, que a menudo no
es el correo corporativo con el que se conoce a la persona. Un correo que no
corresponde no da error: devuelve cero, y eso se lee igual que "no tiene nada
asignado". El nombre para mostrar tampoco sirve —`= 'Nombre Apellido'` devuelve
cero— aunque sea lo que enseña el portal.

Si necesitas el correo de verdad —`--assigned-to` lo pide, no acepta `@Me`—
sácalo en vez de adivinarlo:

```bash
curl -s -u ":$AZURE_DEVOPS_EXT_PAT" \
  "https://dev.azure.com/<org>/_apis/connectionData?api-version=7.0-preview" \
  | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).authenticatedUser.properties.Account["\$value"]'
```

Con `curl` y no con `az rest`: `az rest` se autentica contra Azure AD, ignora el
PAT y devuelve la página de inicio de sesión en HTML. Y `az devops user show`
pide permiso *ReadExtended Users*, que un PAT de trabajo normal no tiene.

Esto vale mientras el PAT sea **personal**. Con un token de servicio compartido,
`@Me` es la cuenta de servicio y no la de nadie — y además todo lo que se cree
queda atribuido al servicio, no a quien lo hizo. Que cada quien use el suyo.

**No adivines la identidad de otras personas.** Para filtrar por alguien más,
pregunta el correo o sácalo de un work item que ya tenga asignado.

Un comentario al cerrar, con el número de build o el commit, ahorra la arqueología de meses después.

Después de cualquiera de estas, estampa la huella si el work item aún no la
tiene (ver más abajo).

## La huella `agent`

Todo lo que pasa por aquí queda etiquetado con `agent`. No es decoración: es lo
único que permite, en un tablero heredado con cientos de tareas asignadas y sin
empezar, separar las que se están gestionando de verdad del fondo de armario.

- **Al crear** no hay que hacer nada: `boards create` la estampa en la misma
  llamada. Si creas con `az`, el work item nace sin huella.
- **Al actualizar** un work item que no la tiene —transicionarlo, reasignarlo,
  comentarlo— estámpala después:

```bash
npx @skapxd/azure-devops-agent boards tag 11604 11605
```

Acepta varios ids y es idempotente: si ya la tiene, no escribe. Eso importa
porque cada escritura crea una revisión y notifica a quien siga el work item.

**No uses `az` para esto.** Su única vía es
`--fields "System.Tags=agent"`, que **asigna** el campo entero: si el work item
tenía etiquetas, las borra sin avisar y sin forma de saber cuáles eran.

Para recuperar después lo que estás gestionando:

```bash
az boards query -o table --wiql "SELECT [System.Id], [System.Title], [System.State] \
FROM WorkItems WHERE [System.TeamProject] = 'MiProyecto' \
AND [System.Tags] CONTAINS 'agent' AND [System.State] <> 'Done'"
```

Sobre `System.Tags`, `CONTAINS` compara la **etiqueta entera** pese a lo que
sugiere el nombre: buscar `prioridad` no encuentra `prioridad 24`. Es lo más
parecido a igualdad que existe aquí —Azure DevOps rechaza `=`, `EVER` e `IN`
sobre este campo— y basta: `agent` no puede colisionar con `agente-comercial`.

**Y escribe el nombre del proyecto literal, nunca `@project`.** Esa macro no
resuelve en `az boards query` —tampoco pasando `--project`— y la consulta
devuelve cero filas sin dar ningún error. En la búsqueda de duplicados eso es
especialmente dañino: "no encontré nada" te lleva a crear el duplicado. El
nombre lo da `az repos list --query "[0].project.name" -o tsv`. Las demás
macros (`@today`, `@me`) sí funcionan.

**Y `az boards query` corta en 1000 filas.** Una consulta truncada se lee
exactamente igual que una completa, así que en un tablero grande no concluyas
"esto es todo" sin acotar: filtra por fecha, por iteración o por tipo hasta
bajar del tope. Si una consulta devuelve justo 1000, casi seguro hay más.

Estampar es modificar: si el work item no es parte de lo que el usuario te acaba
de pedir, pregunta antes. Y nunca quites etiquetas que puso otra persona; no
sabes qué consulta guardada dependía de ellas.

## Enlazar el código con su work item

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
