// src/core/errors/UserAlreadyExistsError.ts
export class UserAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserAlreadyExistsError';

    // This line is important for instances of custom errors to be correctly identified
    // when using 'instanceof' in older JavaScript environments (pre-ES6 class features fully supported)
    // or when transpiling. Modern environments might not strictly need it for 'instanceof'.
    Object.setPrototypeOf(this, UserAlreadyExistsError.prototype);
  }
}
