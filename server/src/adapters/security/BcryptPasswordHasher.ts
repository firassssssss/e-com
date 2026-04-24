import { Service } from 'typedi';
import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../../core/gateways/IPasswordHasher.js';

@Service() // Mark as a service for TypeDI
export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
