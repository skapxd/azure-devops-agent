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
  },
});
