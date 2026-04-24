// src/core/errors/InvalidCredentialsError.ts
export class InvalidCredentialsError extends Error {
  constructor(message: string = 'Invalid credentials.') {
    super(message);
    this.name = 'InvalidCredentialsError';
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}
