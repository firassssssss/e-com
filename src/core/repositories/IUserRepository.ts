import { User } from '../entities/User.js';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updatePartial(id: string, fields: Partial<Omit<User, 'id'>>): Promise<User | null>;
  delete(id: string): Promise<void>;

  /** Search users by text with pagination */
  search(text: string, limit: number, offset: number): Promise<User[]>;

  /**
   * Find all users with admin role
   * @returns Array of admin users
   */
  findAdmins(): Promise<User[]>;
}
