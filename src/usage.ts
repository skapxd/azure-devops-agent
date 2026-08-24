/** Ayuda del CLI. Es lo primero que lee alguien que no lo conoce. */
export const USAGE = `azure-devops-agent — Azure DevOps desde la terminal

  Detecta organización y proyecto del git remote: no hay nada que configurar.

Contexto
  ado context [--json]              organización, proyecto y repositorio
  ado check                         valida el token y muestra la identidad

Boards
  ado boards types                  tipos de work item del proyecto
  ado boards states <tipo>          estados reales del workflow de ese tipo
  ado boards iteration              ruta del sprint en curso
  ado boards search <texto>         busca por título (evita duplicar tickets)
  ado boards show <id>              un work item con su padre y sus hijos
  ado boards list --assignee <mail> trabajo abierto de esa persona
  ado boards orphans                ramas locales sin work item asociado

  ado boards create --type <tipo> --title <texto>
                    [--description <html>] [--parent <id>]
                    [--assign <correo>] [--iteration <ruta>]

  ado boards update <id> [--state <estado>] [--assign <correo>]
                         [--comment <texto>]

Autenticación
  Personal Access Token en AZURE_DEVOPS_EXT_PAT. Se busca en el entorno y,
  si no está, en ~/.zshrc, ~/.bashrc, ~/.profile, ~/.zshenv y ~/.bash_profile.
`;
