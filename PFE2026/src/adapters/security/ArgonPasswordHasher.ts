import argon2 from "argon2";
import { IPasswordHasher } from "../../core/gateways/IPasswordHasher";

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 4,
};

export class ArgonPasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    if (this.isBcryptHash(hash)) return this.compareBcrypt(password, hash);
    return argon2.verify(hash, password);
  }

  needsUpgrade(hash: string): boolean {
    return this.isBcryptHash(hash);
  }

  private isBcryptHash(hash: string): boolean {
    return hash.startsWith("$2b$") || hash.startsWith("$2a$");
  }

  private async compareBcrypt(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import("bcrypt");
    return bcrypt.compare(password, hash);
  }
}