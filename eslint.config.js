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
    ignores: ["node_modules/**", "dist/**", "coverage/**"],
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
