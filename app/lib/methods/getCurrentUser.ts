import database from '../database';
import { IUser } from '../../definitions';

export async function getCurrentUser(): Promise<Partial<Pick<IUser, 'id' | 'username' | 'name'>>> {
  const db = database.active;
  try {
    const usersCollection = db.get('users');
    const users = await usersCollection.query().fetch(); // usually only 1 logged-in user
    if (users.length > 0) {
      const u: any = users[0];
      return {
        id: u.id,
        username: u.username,
        name: u.name
      };
    }
  } catch (e) {
    console.error('Failed to load user from DB', e);
  }
  // fallback system user
  return { id: '1', username: 'system', name: 'System' };
}