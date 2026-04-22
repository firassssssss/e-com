import { Service } from 'typedi';
import { db } from '../../../infrastructure/db/index.js';
import { user } from '../../../infrastructure/db/schema/auth.js';

export interface ListUsersResult {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
}

export interface IListUsersUseCase {
  execute(): Promise<ListUsersResult[]>;
}

@Service()
export class ListUsersUseCase implements IListUsersUseCase {
  async execute(): Promise<ListUsersResult[]> {
    const users = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    }).from(user);

    return users;
  }
}
