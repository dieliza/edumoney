/** Solo estos mensajes revisados pueden mostrarse como explicación de una operación financiera. */
export class UserInputError extends Error {}
export function userMessage(error: unknown): string {
  return error instanceof UserInputError ? error.message : 'No pudimos completar la operación en el almacenamiento protegido. Conserva tus datos y vuelve a intentarlo.';
}
