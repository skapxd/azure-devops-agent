/** Cómo quedó un work item después de intentar estamparle la huella. */
export interface Etiquetado {
  readonly id: string;
  readonly etiquetas: readonly string[];
  /** `false` cuando ya las tenía y no hizo falta escribir. */
  readonly cambiado: boolean;
}
