import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  // El shebang ya está en src/cli.ts y tsup lo conserva; añadirlo también aquí
  // lo duplicaría y dejaría el segundo en la línea 2, donde Node lo rechaza.
  // El CLI se publica compilado para que ejecutarlo no exija TypeScript ni tsx.
  sourcemap: true,
  dts: false,
  // Resuelve los alias @/* de tsconfig al empaquetar; sin esto el bundle
  // saldría con imports que Node no sabe resolver.
  tsconfig: "tsconfig.json",
});
