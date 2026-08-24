#!/usr/bin/env -S npx tsx
/**
 * Contexto de Azure DevOps derivado del repositorio actual.
 *
 * Multiplataforma: solo necesita Node 18+ y git. Sin dependencias de runtime,
 * sin shell, sin curl y sin python — todo lo que la skill consulta pasa por aquí.
 *
 * Uso:
 *   npx tsx ado-context.ts                 contexto detectado (org, proyecto, repo)
 *   npx tsx ado-context.ts --json          lo mismo en JSON, para otro proceso
 *   npx tsx ado-context.ts check           además valida el token y muestra la identidad
 *   npx tsx ado-context.ts iteration       ruta del sprint en curso (vacío si no hay)
 *   npx tsx ado-context.ts states <tipo>   estados válidos de un tipo de work item
 *   npx tsx ado-context.ts types           tipos de work item del proyecto
 *
 * Notas de seguridad, para que sigan siendo ciertas si lo modificas:
 * - El token nunca se imprime, ni se escribe a disco, ni se pasa por argumentos
 *   (argv es visible para cualquier proceso de la máquina). Solo viaja en la
 *   cabecera Authorization.
 * - Los perfiles de shell se leen con expresión regular, nunca se evalúan.
 * - Los procesos se lanzan con execFile y lista de argumentos, nunca con una
 *   cadena interpretada por el shell, así que no hay superficie de inyección.
 * - Lo que sale del remote se valida antes de construir una URL.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export interface AdoContext {
  org: string;
  project: string;
  repo: string;
  orgUrl: string;
}

/** Identificadores admitidos en un segmento de URL de Azure DevOps. */
const SEGMENTO_VALIDO = /^[A-Za-z0-9._~-][A-Za-z0-9._~%\s-]*$/;

/** Los tres formatos de remote que usa Azure DevOps, cada uno con los datos en otro sitio. */
const PATRONES_REMOTE: readonly RegExp[] = [
  // git@ssh.dev.azure.com:v3/<org>/<proyecto>/<repo>
  /^(?:[^@]+@)?ssh\.dev\.azure\.com:v3\/([^/]+)\/([^/]+)\/(.+)$/,
  // https://<algo>@dev.azure.com/<org>/<proyecto>/_git/<repo>
  /^https?:\/\/(?:[^@/]+@)?dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/(.+)$/,
  // https://<org>.visualstudio.com/<proyecto>/_git/<repo>   (formato antiguo)
  /^https?:\/\/([^.]+)\.visualstudio\.com\/([^/]+)\/_git\/(.+)$/,
];

/** Extrae organización, proyecto y repositorio de la URL de un remote. */
export function parseRemote(url: string): AdoContext | null {
  const limpia = url.trim().replace(/\.git$/, "");

  for (const patron of PATRONES_REMOTE) {
    const m = limpia.match(patron);
    if (!m) continue;

    const [, org, project, repo] = m;
    if (!org || !project || !repo) continue;

    // Se valida antes de que estos valores acaben dentro de una URL.
    if (![org, project, repo].every((s) => SEGMENTO_VALIDO.test(s))) return null;

    return {
      org,
      project,
      repo,
      orgUrl: `https://dev.azure.com/${encodeURIComponent(org)}`,
    };
  }
  return null;
}

/** URL del remote 'origin' del repositorio actual. */
function remoteUrl(): string | null {
  try {
    // execFile con lista de argumentos: nada pasa por un shell.
    return execFileSync("git", ["remote", "get-url", "origin"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Busca el Personal Access Token en el entorno y, si no está, en los perfiles
 * de shell — que no se cargan en sesiones no interactivas, de ahí el rodeo.
 * Los perfiles se leen como texto: nunca se ejecutan.
 */
export function loadPat(): string | null {
  const delEntorno = process.env["AZURE_DEVOPS_EXT_PAT"];
  if (delEntorno) return delEntorno;

  const perfiles = [".zshrc", ".bashrc", ".profile", ".zshenv", ".bash_profile"];
  for (const nombre of perfiles) {
    try {
      const contenido = readFileSync(join(homedir(), nombre), "utf8");
      const m = contenido.match(
        /^\s*export\s+AZURE_DEVOPS_EXT_PAT\s*=\s*["']?([^"'\s#]+)/m,
      );
      if (m?.[1]) return m[1];
    } catch {
      // Perfil inexistente o ilegible: se prueba el siguiente.
    }
  }
  return null;
}

/** Llama a la API REST de Azure DevOps. El token solo viaja en la cabecera. */
async function api(url: string, pat: string): Promise<unknown> {
  const auth = Buffer.from(`:${pat}`).toString("base64");
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
  });

  // Azure DevOps responde 203 con HTML de login cuando el token no sirve.
  if (res.status === 401 || res.status === 203) {
    throw new Error("el token no autenticó — puede estar vencido o sin permisos");
  }
  if (!res.ok) throw new Error(`la API respondió ${res.status}`);

  const texto = await res.text();
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error("la API no devolvió JSON — revisa el token y la organización");
  }
}

interface RespuestaConValores {
  value?: readonly Record<string, unknown>[];
}

/** Acota la respuesta de la API a la forma `{ value: [...] }` que devuelven estos endpoints. */
function valores(respuesta: unknown): readonly Record<string, unknown>[] {
  const v = (respuesta as RespuestaConValores | null)?.value;
  return Array.isArray(v) ? v : [];
}

/**
 * Aborta con un mensaje. El tipo `never` le dice al verificador que aquí se
 * corta el flujo, para que no crea que las funciones de abajo devuelven null.
 */
function fatal(mensaje: string): never {
  console.error(mensaje);
  process.exit(1);
}

function contextoOSalir(): AdoContext {
  const url = remoteUrl();
  if (!url) {
    return fatal("error: no hay remote 'origin' — ¿estás dentro de un repo git?");
  }
  const ctx = parseRemote(url);
  if (!ctx) {
    return fatal(`error: el remote no es de Azure DevOps: ${url}`);
  }
  return ctx;
}

function patOSalir(): string {
  const pat = loadPat();
  if (!pat) {
    return fatal(
      "error: falta AZURE_DEVOPS_EXT_PAT — genera un token en\n" +
        "  https://dev.azure.com/<org>/_usersSettings/tokens\n" +
        "y expórtalo en tu perfil de shell.",
    );
  }
  return pat;
}

function imprimirContexto(ctx: AdoContext): void {
  console.log(`organización: ${ctx.org}`);
  console.log(`proyecto:     ${ctx.project}`);
  console.log(`repositorio:  ${ctx.repo}`);
}

async function main(): Promise<void> {
  const [comando = "context", ...resto] = process.argv.slice(2);
  const ctx = contextoOSalir();

  switch (comando) {
    case "context":
    case "--json": {
      if (comando === "--json" || resto.includes("--json")) {
        console.log(JSON.stringify(ctx, null, 2));
      } else {
        imprimirContexto(ctx);
        console.log(`url:          ${ctx.orgUrl}`);
      }
      return;
    }

    case "check": {
      imprimirContexto(ctx);
      const perfil = (await api(
        `https://vssps.dev.azure.com/${encodeURIComponent(ctx.org)}/_apis/profile/profiles/me?api-version=7.0`,
        patOSalir(),
      )) as { emailAddress?: string };
      console.log(`identidad:    ${perfil.emailAddress ?? "desconocida"}`);
      return;
    }

    case "iteration": {
      const r = await api(
        `${ctx.orgUrl}/${encodeURIComponent(ctx.project)}/_apis/work/teamsettings/iterations?api-version=7.0&$timeframe=current`,
        patOSalir(),
      );
      console.log(valores(r)[0]?.["path"] ?? "");
      return;
    }

    case "states": {
      const tipo = resto.join(" ");
      if (!tipo) {
        fatal('error: falta el tipo, p. ej. states "Product Backlog Item"');
      }
      const r = await api(
        `${ctx.orgUrl}/${encodeURIComponent(ctx.project)}/_apis/wit/workitemtypes/${encodeURIComponent(tipo)}/states?api-version=7.0`,
        patOSalir(),
      );
      console.log(valores(r).map((s) => s["name"]).join(" → "));
      return;
    }

    case "types": {
      const r = await api(
        `${ctx.orgUrl}/${encodeURIComponent(ctx.project)}/_apis/wit/workitemtypes?api-version=7.0`,
        patOSalir(),
      );
      for (const t of valores(r)) console.log(`- ${t["name"]}`);
      return;
    }

    default:
      fatal(
        `comando desconocido: ${comando}\n` +
          "usa: context | check | iteration | states <tipo> | types",
      );
  }
}

// Solo actúa como CLI cuando se ejecuta directamente. Importarlo (por ejemplo
// desde una prueba) no debe disparar nada ni tocar la red.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((e: unknown) => {
    // Se reporta el mensaje, nunca el token ni la cabecera.
    console.error(`error: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
}
