# azure-devops-agent

Azure DevOps desde la terminal, sin configurar nada: la organización y el proyecto salen del `git remote`.

El repo entrega dos cosas que se usan por separado:

| | Qué es | Cómo se usa |
|---|---|---|
| **CLI** | `@skapxd/azure-devops-agent`, compilado y publicado en npm | `pnpx @skapxd/azure-devops-agent <comando>` |
| **Skill** | Instrucciones para agentes de código (Claude Code, OpenCode, Codex, Cursor…) | `npx skills add skapxd/azure-devops-agent` |

El CLI sirve solo, sin agente. La skill le enseña a tu agente **cuándo** usarlo — que es la parte difícil: el tablero no se desactualiza por ignorancia, sino porque registrar el trabajo compite con escribir código y casi siempre pierde.

## Instalación

**El CLI** no requiere instalación:

```bash
pnpx @skapxd/azure-devops-agent check
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

```
ado context [--json]              organización, proyecto y repositorio
ado check                         valida el token y muestra la identidad

ado boards types                  tipos de work item del proyecto
ado boards states <tipo>          estados reales del workflow de ese tipo
ado boards iteration              ruta del sprint en curso
ado boards search <texto>         busca por título, para no duplicar tickets
ado boards show <id>              un work item con su padre y sus hijos
ado boards list --assignee <mail> trabajo abierto de esa persona
ado boards orphans                ramas locales sin work item asociado

ado boards create --type <tipo> --title <texto>
                  [--description <html>] [--parent <id>]
                  [--assign <correo>] [--iteration <ruta>]

ado boards update <id> [--state <estado>] [--assign <correo>] [--comment <texto>]
```

Tres que resuelven problemas concretos:

- **`create --parent`** crea el work item y lo cuelga de su historia en **una sola llamada**. Con la API en dos pasos, un fallo entre medias deja un huérfano que nadie sabe de dónde salió.
- **`orphans`** lista las ramas que no referencian ningún work item. Es donde más trazabilidad se pierde: una rama sin número nace de un arreglo rápido, se mergea, y no deja rastro.
- **`states`** consulta el workflow real en vez de asumir la plantilla. Casi todos los proyectos lo tienen personalizado, y usar un estado que no existe falla.

## Configuración

Ninguna. Se soportan los tres formatos de remote de Azure DevOps:

```
git@ssh.dev.azure.com:v3/<org>/<proyecto>/<repo>
https://<org>@dev.azure.com/<org>/<proyecto>/_git/<repo>
https://<org>.visualstudio.com/<proyecto>/_git/<repo>
```

Los tipos de work item y sus estados se consultan al proyecto en tiempo real, así que funciona igual con Agile, Scrum, CMMI o un workflow a medida.

## Desarrollo

```bash
pnpm install
pnpm check       # tipos estrictos + lint + pruebas
pnpm build       # compila a dist/
```

Ver [SECURITY.md](SECURITY.md) para las decisiones de manejo del token y por qué el CLI no ejecuta shell.

## Licencia

MIT
