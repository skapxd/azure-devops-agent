/** Un archivo donde puede estar declarado el token, y cómo reconocerlo ahí. */
export interface PerfilConToken {
  /** Ruta relativa al directorio del usuario. */
  readonly ruta: string;
  /** Captura el valor del token en el grupo 1. */
  readonly patron: RegExp;
}
