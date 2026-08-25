// Configuración de ESLint del proyecto.
//
// Existe para que el editor marque los mismos hallazgos que reporta
// `pnpm lint` — el CLI de @skapxd/lint-agent evalúa de forma efímera y solo
// habla cuando se le invoca; esto pone las mismas reglas en el editor, donde
// se ven mientras se escribe.
//
// Las reglas viven dentro del paquete, no aquí: este archivo solo las enchufa
// y declara qué se analiza.

import skapxd from "@skapxd/lint-agent";

export default [
  {
    // Nada que no sea código fuente propio.
    //
    // tests/helpers queda fuera a propósito: son utilidades de prueba que
    // necesitan justo lo que las reglas prohíben —sustituir globales,
    // restaurarlos pase lo que pase y relanzar la aserción original— y forzarlas
    // al modelo de Result las volvería más difíciles de leer sin ganar nada.
    // Los .test.ts sí se revisan.
    ignores: ["node_modules/**", "dist/**", "coverage/**", "tests/helpers/**"],
  },

  // Preset base: el mismo que el CLI autodetecta para este proyecto.
  skapxd.configs.shared.base,

  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        // Análisis con información de tipos: sin esto, las reglas que razonan
        // sobre tipos (Result, exhaustividad) quedan mudas.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
