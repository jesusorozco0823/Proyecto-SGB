const EXAMPLE_SECRET = 'replace-with-a-long-random-string';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

export const env = {
  authSecret(): string {
    const value = required('AUTH_SECRET');
    if (value.length < 32 || value === EXAMPLE_SECRET) {
      throw new Error('AUTH_SECRET debe ser una cadena aleatoria de al menos 32 caracteres, distinta del ejemplo.');
    }
    return value;
  },
};
