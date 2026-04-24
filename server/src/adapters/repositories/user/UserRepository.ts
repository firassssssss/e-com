import { IUserRepository } from '../../../core/repositories/IUserRepository.js';
import { Service } from 'typedi';
import { db } from '../../../infrastructure/db/index.js';
import { user } from '../../../infrastructure/db/schema/index.js';
import { eq, ilike } from 'drizzle-orm';
import { User } from '../../../core/entities/User.js';
import { UserMapper } from './mappers/UserMapper.js';

@Service()
export class UserRepository implements IUserRepository {
  private readonly mapper = new UserMapper();

  async findById(id: string): Promise<User | null> {
    const result = await db.select().from(user).where(eq(user.id, id));
    if (result.length === 0) return null;
    return this.mapper.toDomain(result[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(user).where(eq(user.email, email));
    if (result.length === 0) return null;
    return this.mapper.toDomain(result[0]);
  }

  async updatePartial(id: string, fields: Partial<Omit<User, 'id'>>): Promise<User | null> {
    if (Object.keys(fields).length === 0) return this.findById(id);
    await db.update(user).set({ ...fields, updatedAt: new Date() }).where(eq(user.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await db.delete(user).where(eq(user.id, id));
  }

  async search(text: string, limit: number, offset: number): Promise<User[]> {
    const pattern = `%${text.toLowerCase()}%`;
    const rows = await db
      .select()
      .from(user)
      .where(ilike(user.name, pattern))
      .limit(limit)
      .offset(offset);
    return rows.map(r => this.mapper.toDomain(r));
  }

  async findAdmins(): Promise<User[]> {
    const rows = await db
      .select()
      .from(user)
      .where(eq(user.role, 'admin'));

    return rows.map(r => this.mapper.toDomain(r));
  }
}
