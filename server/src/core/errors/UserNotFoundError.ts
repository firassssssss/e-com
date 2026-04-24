export class UserNotFoundError extends Error {
  constructor(identifier: string) {
    super(`User not found with identifier: ${identifier}`);
    this.name = 'UserNotFoundError';
  }
}
