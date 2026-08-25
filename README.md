# azure-devops-agent

Lo que `az boards` no hace, para trabajar Azure DevOps desde la terminal.

**Complementario a Azure CLI, no un reemplazo.** Para consultar, actualizar o crear work items sin jerarquía, `az boards` ya lo cubre bien y es lo que debes usar. Este proyecto llena solo los huecos que deja.

El repo entrega dos cosas que se usan por separado:

| | Qué es | Cómo se usa |
|---|---|---|
| **CLI** | `@skapxd/azure-devops-agent`, compilado y publicado en npm | `pnpx @skapxd/azure-devops-agent <comando>` |
| **Skill** | Instrucciones para agentes de código (Claude Code, OpenCode, Codex, Cursor…) | `npx skills add skapxd/azure-devops-agent` |

El CLI sirve solo, sin agente. La skill le enseña a tu agente **cuándo** registrar trabajo y **cómo** combinar `az boards` con este CLI — que es la parte difícil: el tablero no se desactualiza por ignorancia, sino porque registrar el trabajo compite con escribir código y casi siempre pierde.

## Instalación

**El CLI** no requiere instalación:

```bash
pnpx @skapxd/azure-devops-agent branches unlinked
```

**La skill**, en todos tus agentes a la vez:

```bash
npx skills add skapxd/azure-devops-agent
```

o solo en algunos:

```bash
npx skills add skapxd/azure-devops-agent -a claude-code -a opencode
```

## Requisitos

- **Node 18+** y **git**. Nada más: ni Azure CLI, ni Python, ni bash — funciona igual en Windows, macOS y Linux.
- **Un Personal Access Token** con permiso *Work Items (Read & Write)*, generado en `https://dev.azure.com/<tu-organizacion>/_usersSettings/tokens`.

En macOS y Linux:

```bash
echo 'export AZURE_DEVOPS_EXT_PAT="<tu-token>"' >> ~/.zshrc
```

En Windows (PowerShell):

```powershell
[Environment]::SetEnvironmentVariable("AZURE_DEVOPS_EXT_PAT", "<tu-token>", "User")
```

El token se lee primero del entorno. Si no está ahí, se busca en el perfil de shell del sistema: en macOS y Linux `~/.zshrc`, `~/.bashrc`, `~/.profile`, `~/.zshenv` y `~/.bash_profile`; en Windows el `$PROFILE` de PowerShell (5.1 y 7+) y los perfiles de Git Bash.

Ese rodeo existe porque en macOS y Linux un shell no interactivo no carga `.zshrc`: la variable está declarada, pero `process.env` no la ve. En Windows el problema casi no se da —las variables viven en el registro y cualquier proceso las ve—, así que ahí el fallback solo cubre a quien prefiera declararla en su `$PROFILE`.

## Comandos

Son cuatro, y cada uno existe porque `az` no lo cubre:

```bash
# los estados por los que puede pasar un work item de ese tipo
npx @skapxd/azure-devops-agent boards states "Product Backlog Item"

# qué ramas tuyas no referencian ningún work item
npx @skapxd/azure-devops-agent branches unlinked

# crea un work item ya colgado de su padre, en una sola llamada
npx @skapxd/azure-devops-agent boards create \
  --type Task --parent 11603 --title "Eliminar el índice único"

# deja la etiqueta agent sin borrar las que el work item ya tenga
npx @skapxd/azure-devops-agent boards tag 11604 11605

# --format <markdown|json|text> en cualquier comando
# (por defecto: text en la terminal, markdown al redirigir)
```

## Desarrollo

```bash
pnpm install
pnpm check            # tipos estrictos + lint + pruebas
pnpm build            # compila a dist/
pnpm dev              # recompila al guardar
pnpm security:audit   # auditoría de dependencias
```

### Publicar

La publicación la hace el CI al empujar un tag, no se ejecuta a mano:

```bash
npm version patch     # o minor / major
git push --follow-tags
```

El workflow verifica en las tres plataformas, audita las dependencias y solo
entonces publica, autenticándose contra npm por **OIDC** — no hay ningún token
guardado como secreto que se pueda filtrar. El paquete se firma con
`--provenance`, así que quien lo instale puede comprobar de qué commit salió.

Para probar un cambio sin publicar, `npx` acepta la ruta local. Ejecútalo
**dentro del repo que quieras consultar**, porque el proyecto sale de su `git
remote`:

```bash
npx ~/dev/azure-devops-agent branches unlinked
```

### Formato de salida

El predeterminado depende de quién va a leer:

- **En la terminal** → `text`. Lo lee una persona, y ahí los `**` y los backticks solo son ruido: nada los renderiza.
- **Redirigido a otro proceso** → `markdown`. Lo consume un programa —un agente de código, casi siempre— y la estructura semántica es justo lo que le ayuda a interpretarlo.

`--format` explícito manda sobre esa decisión.

```console
$ npx @skapxd/azure-devops-agent branches unlinked
**2 ramas sin work item asociado:**

- `fix/ajuste-rapido`
- `back/n-a/duplicar-concesionarios`
```

`--format json` para encadenar con otro proceso, `--format text` para la salida compacta de siempre. Un valor desconocido se rechaza en vez de caer al predeterminado en silencio: quien escribe `--format markdwon` quiere markdown, y darle otra cosa sin avisar le hace perder más tiempo que un error.

Por qué cada uno:

- **`states`** consulta los estados reales del workflow. `az` no los expone, y casi todos los proyectos los tienen personalizados: usar uno que no existe falla.
- **`branches unlinked`** lista las ramas que no referencian ningún work item. No existe en ningún sitio, y es donde más trazabilidad se pierde. Va en su propio grupo porque no consulta el tablero: mira tu git local.
- **`boards tag`** añade una etiqueta **sin borrar** las que el work item ya tenga. En `az` la única vía es `--fields "System.Tags=..."`, que asigna el campo entero y borra el resto sin avisar.
- **`create --parent`** crea el work item **ya colgado** de su padre, en una sola llamada. En `az` son dos comandos (`work-item create` y `relation add`), y un fallo entre ambos deja un huérfano que nadie sabe de dónde salió.

Para todo lo demás —consultar, buscar, actualizar, crear sin jerarquía— usa `az boards`.

## La etiqueta `agent`

Todo lo que este CLI crea o modifica queda etiquetado con `agent`. En un tablero heredado con cientos de tareas asignadas y sin empezar, es lo que permite ver solo las que estás gestionando:

```bash
az boards query -o table --wiql "SELECT [System.Id], [System.Title], [System.State] \
FROM WorkItems WHERE [System.TeamProject] = 'MiProyecto' \
AND [System.Tags] CONTAINS 'agent' AND [System.State] <> 'Done'"
```

Dos detalles de WIQL que cuestan tiempo descubrir, ambos verificados contra un tablero real:

- **El nombre del proyecto va literal.** La macro `@project` no resuelve en `az boards query` —ni pasando `--project`— y la consulta devuelve **cero filas sin dar ningún error**.
- **`CONTAINS` sobre `System.Tags` compara la etiqueta entera**, pese al nombre: buscar `prioridad` no encuentra `prioridad 24`. Es lo más parecido a igualdad que hay, porque Azure DevOps rechaza `=`, `EVER` e `IN` sobre ese campo.

## Configuración

Ninguna. Se soportan los cuatro formatos de remote de Azure DevOps:

```
git@ssh.dev.azure.com:v3/<org>/<proyecto>/<repo>
<org>@vs-ssh.visualstudio.com:v3/<org>/<proyecto>/<repo>
https://<org>@dev.azure.com/<org>/<proyecto>/_git/<repo>
https://<org>.visualstudio.com/<proyecto>/_git/<repo>
```

Los tipos de work item y sus estados se consultan al proyecto en tiempo real, así que funciona igual con Agile, Scrum, CMMI o un workflow a medida.

Ver [SECURITY.md](SECURITY.md) para las decisiones de manejo del token y por qué el CLI no ejecuta shell.

## Licencia

MIT
