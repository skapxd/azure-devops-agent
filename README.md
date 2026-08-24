# azure-devops-skill

Una [Agent Skill](https://github.com/vercel-labs/skills) que hace que registrar trabajo en **Azure Boards** cueste una frase en vez de cinco minutos en el portal.

El tablero es la memoria del equipo, pero mantenerlo al día compite con escribir código y casi siempre pierde. No por desconocimiento: por fricción. Esta skill traslada la creación de work items a la terminal, donde ya estás, y hace que el agente proponga registrar el trabajo que de otro modo se perdería — ramas sin historia asociada, deuda técnica, hallazgos de code review que quedan para después.

Funciona con cualquier agente compatible con el formato de skills: Claude Code, OpenCode, Codex, Cursor y otros.

## Instalación

```bash
npx skills add skapxd/azure-devops-skill
```

Para instalarla solo en algunos agentes:

```bash
npx skills add skapxd/azure-devops-skill -a claude-code -a opencode
```

## Requisitos

- **Azure CLI** con la extensión de DevOps:
  ```bash
  az extension add --name azure-devops
  ```
- **Un Personal Access Token** con permiso *Work Items (Read & Write)*, generado en
  `https://dev.azure.com/<tu-organizacion>/_usersSettings/tokens` y exportado en tu perfil:
  ```bash
  echo 'export AZURE_DEVOPS_EXT_PAT="<tu-token>"' >> ~/.zshrc
  ```
- **Node 18+** — sin dependencias de runtime.

## Configuración

Ninguna. La organización, el proyecto y el repositorio se derivan del `git remote`, así que la skill funciona en cualquier repo de Azure DevOps sin tocar un archivo de config. Soporta los tres formatos de remote:

```
git@ssh.dev.azure.com:v3/<org>/<proyecto>/<repo>
https://<org>@dev.azure.com/<org>/<proyecto>/_git/<repo>
https://<org>.visualstudio.com/<proyecto>/_git/<repo>
```

Para comprobar qué detecta en tu repo:

```bash
node skills/azure-devops/scripts/ado-context.mjs check
```

Los tipos de work item y sus estados también se consultan al proyecto en tiempo real, en vez de asumir una plantilla — así funciona igual con Agile, Scrum, CMMI o un workflow personalizado.

## Qué hace

- Propone crear el work item cuando detecta trabajo que no tiene ninguno detrás, con título y descripción ya redactados
- Crea historias, tareas y bugs, y cuelga las tareas de su historia padre
- Asigna, cambia de estado y comenta
- Consulta qué hay asignado y en qué va cada cosa
- Sugiere el `#id` en los mensajes de commit, que es lo que enlaza el código con el tablero

Siempre pide confirmación antes de crear o modificar algo: un work item es visible para todo el equipo y notifica a quien se asigne.

## Convenciones de tu equipo

La skill no inventa convenciones propias (cómo nombran las ramas, qué significa cada estado, quién revisa). Si tu repo tiene un `CLAUDE.md` o `AGENTS.md` con esas reglas, las lee y las respeta por encima de sus propios valores por defecto. Ese es el lugar para lo específico de tu equipo — así no viaja dentro de un paquete público.

## Licencia

MIT
