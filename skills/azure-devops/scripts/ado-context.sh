#!/usr/bin/env bash
# Deriva el contexto de Azure DevOps del repositorio actual, sin configuración.
#
# Uso:
#   source ado-context.sh          # exporta ADO_ORG, ADO_PROJECT, ADO_REPO, ADO_ORG_URL
#   ./ado-context.sh               # imprime el contexto detectado
#   ./ado-context.sh --check       # además valida el PAT y muestra la identidad
#
# Existe para que ninguna invocación tenga que re-descubrir cómo se parsea un
# remote de Azure DevOps ni dónde vive el token.

set -uo pipefail

ado_parse_remote() {
  local url="${1:-}"
  [ -z "$url" ] && return 1
  case "$url" in
    # git@ssh.dev.azure.com:v3/<org>/<proyecto>/<repo>
    *ssh.dev.azure.com*)
      ADO_ORG=$(sed -E 's|.*ssh\.dev\.azure\.com:v3/([^/]+)/.*|\1|' <<<"$url")
      ADO_PROJECT=$(sed -E 's|.*ssh\.dev\.azure\.com:v3/[^/]+/([^/]+)/.*|\1|' <<<"$url")
      ADO_REPO=$(sed -E 's|.*ssh\.dev\.azure\.com:v3/[^/]+/[^/]+/(.*)|\1|' <<<"$url")
      ;;
    # https://<algo>@dev.azure.com/<org>/<proyecto>/_git/<repo>
    *dev.azure.com*)
      ADO_ORG=$(sed -E 's|https://([^@]+@)?dev\.azure\.com/([^/]+)/.*|\2|' <<<"$url")
      ADO_PROJECT=$(sed -E 's|https://([^@]+@)?dev\.azure\.com/[^/]+/([^/]+)/_git/.*|\2|' <<<"$url")
      ADO_REPO=$(sed -E 's|.*/_git/(.*)|\1|' <<<"$url")
      ;;
    # https://<org>.visualstudio.com/<proyecto>/_git/<repo>   (formato antiguo)
    *visualstudio.com*)
      ADO_ORG=$(sed -E 's|https://([^.]+)\.visualstudio\.com/.*|\1|' <<<"$url")
      ADO_PROJECT=$(sed -E 's|https://[^.]+\.visualstudio\.com/([^/]+)/_git/.*|\1|' <<<"$url")
      ADO_REPO=$(sed -E 's|.*/_git/(.*)|\1|' <<<"$url")
      ;;
    *) return 1 ;;
  esac
  ADO_REPO="${ADO_REPO%.git}"
  ADO_ORG_URL="https://dev.azure.com/${ADO_ORG}"
  export ADO_ORG ADO_PROJECT ADO_REPO ADO_ORG_URL
}

# El PAT suele estar en el perfil del usuario, que no se carga en shells no
# interactivos. Se busca primero en el entorno y luego en los perfiles comunes.
ado_load_pat() {
  [ -n "${AZURE_DEVOPS_EXT_PAT:-}" ] && return 0
  local f
  for f in ~/.zshrc ~/.bashrc ~/.profile ~/.zshenv; do
    [ -f "$f" ] || continue
    local line
    line=$(grep -m1 '^export AZURE_DEVOPS_EXT_PAT' "$f" 2>/dev/null) || continue
    eval "$line"
    [ -n "${AZURE_DEVOPS_EXT_PAT:-}" ] && return 0
  done
  return 1
}

# Cabecera de autenticación para llamadas REST.
ado_auth_header() {
  printf 'Authorization: Basic %s' "$(printf ':%s' "$AZURE_DEVOPS_EXT_PAT" | base64)"
}

ado_context() {
  local url
  url=$(git remote get-url origin 2>/dev/null) || {
    echo "error: no hay remote 'origin' — ¿estás dentro de un repo git?" >&2
    return 1
  }
  ado_parse_remote "$url" || {
    echo "error: el remote no es de Azure DevOps: $url" >&2
    return 1
  }
}

# Ejecutado directamente (no con source): imprime lo detectado.
if [ "${BASH_SOURCE[0]:-$0}" = "$0" ]; then
  ado_context || exit 1
  echo "organización: $ADO_ORG"
  echo "proyecto:     $ADO_PROJECT"
  echo "repositorio:  $ADO_REPO"
  echo "url:          $ADO_ORG_URL"

  if [ "${1:-}" = "--check" ]; then
    if ado_load_pat; then
      identidad=$(curl -s -H "$(ado_auth_header)" \
        "https://vssps.dev.azure.com/${ADO_ORG}/_apis/profile/profiles/me?api-version=7.0" \
        | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("emailAddress","?"))' 2>/dev/null)
      if [ -n "$identidad" ] && [ "$identidad" != "?" ]; then
        echo "identidad:    $identidad"
      else
        echo "identidad:    el PAT no autenticó — puede estar vencido o sin permiso de Work Items" >&2
      fi
    else
      echo "identidad:    falta AZURE_DEVOPS_EXT_PAT (ver README)" >&2
    fi
  fi
fi
