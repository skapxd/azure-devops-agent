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

Son cuatro, y cada uno existe porque `az` no lo cubre:

```
ado context [--json]        organización, proyecto, repositorio e identidad
ado boards states <tipo>    estados válidos del workflow de ese tipo
ado boards orphans          ramas locales sin work item asociado
ado boards create --type <tipo> --title <texto> --parent <id>
                  [--description <html>] [--assign <correo>] [--iteration <ruta>]
```

Por qué cada uno:

- **`context`** deriva del `git remote` el `--org` y `--project` que `az` pide en cada comando, más la identidad del token. `az` sabe autodetectar la organización con `--detect`, pero no el proyecto, y no responde "¿con qué cuenta estoy trabajando?" — dato necesario para asignar sin adivinar correos.
- **`states`** consulta los estados reales del workflow. `az` no los expone, y casi todos los proyectos los tienen personalizados: usar uno que no existe falla.
- **`orphans`** lista las ramas que no referencian ningún work item. No existe en ningún sitio, y es donde más trazabilidad se pierde.
- **`create --parent`** crea el work item **ya colgado** de su historia, en una sola llamada. En `az` son dos comandos (`work-item create` y `relation add`), y un fallo entre ambos deja un huérfano que nadie sabe de dónde salió.

Para todo lo demás —consultar, buscar, actualizar, crear sin jerarquía— usa `az boards`.

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
