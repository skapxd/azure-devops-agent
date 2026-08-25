import type { PerfilConToken } from "@/auth/perfil-con-token";

/** Sintaxis POSIX: `export AZURE_DEVOPS_EXT_PAT="..."` */
const DECLARACION_POSIX =
  /^\s*export\s+AZURE_DEVOPS_EXT_PAT\s*=\s*["']?([^"'\s#]+)/m;

/** Sintaxis PowerShell: `$env:AZURE_DEVOPS_EXT_PAT = "..."` */
const DECLARACION_POWERSHELL =
  /^\s*\$env:AZURE_DEVOPS_EXT_PAT\s*=\s*["']?([^"'\s#]+)/im;

const PERFILES_POSIX: readonly PerfilConToken[] = [
  { ruta: ".zshrc", patron: DECLARACION_POSIX },
  { ruta: ".bashrc", patron: DECLARACION_POSIX },
  { ruta: ".profile", patron: DECLARACION_POSIX },
  { ruta: ".zshenv", patron: DECLARACION_POSIX },
  { ruta: ".bash_profile", patron: DECLARACION_POSIX },
];

const PERFILES_WINDOWS: readonly PerfilConToken[] = [
  // PowerShell 7+
  {
    ruta: "Documents/PowerShell/Microsoft.PowerShell_profile.ps1",
    patron: DECLARACION_POWERSHELL,
  },
  // Windows PowerShell 5.1, el que viene de fábrica
  {
    ruta: "Documents/WindowsPowerShell/Microsoft.PowerShell_profile.ps1",
    patron: DECLARACION_POWERSHELL,
  },
  // Git Bash y WSL sobre Windows siguen usando perfiles POSIX
  { ruta: ".bashrc", patron: DECLARACION_POSIX },
  { ruta: ".bash_profile", patron: DECLARACION_POSIX },
];

/**
 * ## perfilesConToken
 *
 * Archivos donde buscar el token, según el sistema operativo.
 *
 * En Windows esto es una red de seguridad menos necesaria: las variables de
 * entorno viven en el registro y cualquier proceso las ve, mientras que en
 * macOS y Linux un shell no interactivo no carga `.zshrc` y el token
 * "desaparece". Aun así se cubre PowerShell, porque quien lo declara en su
 * `$PROFILE` esperaría que funcione.
 *
 * ```ts
 * perfilesConToken("win32");  // perfiles de PowerShell + los de Git Bash
 * perfilesConToken("darwin"); // .zshrc, .bashrc, .profile, …
 * ```
 */
export function perfilesConToken(
  plataforma: NodeJS.Platform,
): readonly PerfilConToken[] {
  const esWindows = plataforma === "win32";
  if (esWindows) return PERFILES_WINDOWS;
  return PERFILES_POSIX;
}
