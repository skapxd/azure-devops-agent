# Seguridad

Esta skill lee y escribe en el Azure DevOps de quien la instala, así que el código que la acompaña se mantiene deliberadamente pequeño y aburrido. Estas son las decisiones que lo sostienen; si modificas el script, conviene que sigan siendo ciertas.

## Superficie de dependencias

**Tres dependencias de runtime**, todas sin dependencias propias — el árbol es plano, no una cascada:

| Paquete | Para qué | Por qué se acepta |
|---|---|---|
| `commander` | parseo de argumentos | Reemplazó a un parser propio que fallaba en `--flag=valor` y aceptaba `--title` sin valor, creando work items titulados `"true"`. Un parser de CLI escrito a mano es más riesgo que una dependencia establecida. |
| `@skapxd/result` | errores como valores | Evita `try/catch` disperso; los fallos se modelan y se consumen en un solo sitio. |
| `ts-pattern` | despacho exhaustivo | El compilador exige cubrir cada variante de error: una nueva no puede quedar sin tratar en silencio. |

Todo lo demás sale de Node 18+ (`node:child_process`, `node:fs`, `node:os`, `node:path`, `node:url`, `fetch` global).

`typescript`, `@types/node`, `tsx`, `tsup`, `eslint` y `@skapxd/lint-agent` son de desarrollo: no se ejecutan ni se distribuyen con el paquete publicado.

**La skill no lleva ninguna.** Lo que `npx skills add` copia a la máquina de cada persona es un único `SKILL.md`: markdown, sin código y sin dependencias. Toda la superficie ejecutable vive en el CLI, que es un paquete npm normal con su lockfile y su auditoría.

## Manejo del token

El Personal Access Token es el activo sensible. Las reglas:

- **Nunca se imprime.** Ni en la salida normal ni en los mensajes de error, que reportan solo el mensaje de la excepción.
- **Nunca se escribe a disco.**
- **Nunca se pasa por argumentos.** `argv` es visible para cualquier proceso de la máquina (`ps`), así que el token solo viaja en la cabecera `Authorization` de la petición.
- **Se lee, no se ejecuta.** Los perfiles de shell (`.zshrc`, `.bashrc`, …) se leen como texto y se extrae el valor con una expresión regular.

Esa última decisión merece contexto: la primera versión de este script era bash y hacía `eval` de la línea del perfil que definía la variable. Funcionaba, pero significaba ejecutar contenido de un archivo — inyección de código de manual, y con razón cualquier escáner estático lo marca. Al reescribirlo en Node desapareció.

## Ejecución de procesos

Solo se lanza un proceso externo: `git remote get-url origin`. Se hace con `execFileSync` y **lista de argumentos**, nunca con una cadena interpretada por un shell, así que no hay forma de inyectar comandos por esa vía.

## Datos que vienen del repositorio

La URL del remote es entrada no confiable: la controla quien haya configurado el repo, y de ella salen la organización y el proyecto que acaban dentro de una URL.

Antes de usarse, cada segmento se valida contra una lista de caracteres permitidos y se escapa con `encodeURIComponent`. Los patrones aceptan únicamente los tres hosts de Azure DevOps, así que un remote apuntando a otro dominio se rechaza en vez de convertirse en una petición a un servidor ajeno.

Hay pruebas que cubren esto explícitamente: path traversal, sustitución de comandos, backticks, punto y coma, pipes y hosts que solo se parecen al de Azure.

## Alcance de los permisos

El token necesita únicamente los permisos del área que vayas a usar — para Boards, *Work Items (Read & Write)*. No hace falta acceso total. Un token de alcance mínimo limita el daño si se filtra.

## Qué NO hace esta skill

- No crea ni rota tokens
- No modifica la configuración de git ni los perfiles de shell
- No envía datos a ningún servicio que no sea la organización de Azure DevOps del propio repositorio
- No instala nada en tiempo de ejecución

## Política de scripts de instalación

El proyecto usa pnpm 11 con `allowBuilds`, así que **ningún paquete puede ejecutar código al instalarse** salvo que se apruebe explícitamente en `pnpm-workspace.yaml`. Es la protección contra el vector más común de ataque de cadena de suministro: un paquete comprometido que ejecuta su payload en un `postinstall`.

Hoy no hay ninguno aprobado.

## Verificar por tu cuenta

```bash
pnpm check     # tipos estrictos + lint + pruebas
pnpm audit     # auditoría del árbol de dependencias
```

## Reportar un problema

Si encuentras una vulnerabilidad, abre un issue describiendo el impacto y cómo reproducirlo.
