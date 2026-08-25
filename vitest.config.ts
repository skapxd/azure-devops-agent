import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Los alias @/* viven en tsconfig.json, pero Vite no lee tsconfig: sin esto
    // los imports de las pruebas no resolverían.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Las utilidades de prueba las usan specs repartidas por todo src; sin
      // alias cada una las alcanzaría con una ristra de "../".
      "@test": fileURLToPath(new URL("./tests/helpers", import.meta.url)),
    },
  },
  test: {
    // Las pruebas unitarias viven junto a su unidad, en carpeta/index.spec.ts.
    // En tests/ solo queda lo que no pertenece a un archivo concreto: el e2e
    // del CLI y la validación de la skill.
    include: ["src/**/*.spec.ts", "tests/**/*.test.ts"],
    // Sin globals: `describe`, `test` y `expect` se importan. Así el editor y
    // el typecheck saben de dónde salen, y no hace falta declarar tipos sueltos
    // en tsconfig solo para que TypeScript no proteste.
    globals: false,
    // Las pruebas cambian el directorio de trabajo y sustituyen el `fetch`
    // global. Con un proceso por archivo eso no se pisa entre archivos, y
    // dentro de cada uno las pruebas ya corren en orden.
    pool: "forks",
    isolate: true,
    coverage: {
      provider: "v8",
      // Todo lo que vitest genera cuelga de .vitest/, y esa carpeta entera está
      // ignorada. Son artefactos regenerables en cada ejecución: versionarlos
      // solo produce diffs de ruido en cada PR.
      reportsDirectory: "./.vitest/coverage",
      // Solo el código propio: las pruebas no se miden a sí mismas.
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.spec.ts",
        // El e2e sí ejercita cli.ts, pero lanzando `node dist/cli.js` en otro
        // proceso: la cobertura de v8 vive en este, así que lo vería siempre a
        // 0 %. Dejarlo en el informe sería un rojo permanente que enseña a
        // ignorar el informe entero.
        "src/cli.ts",
        // Cadenas de ayuda. No hay ramas ni decisiones que cubrir.
        "src/help-examples.ts",
      ],
      // `json` es el que lee el explorador de pruebas para pintar las líneas
      // cubiertas en el margen del editor; `text` es para la terminal.
      reporter: ["text", "html", "json", "lcov"],
    },
  },
});
