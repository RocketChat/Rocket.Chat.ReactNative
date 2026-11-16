import log from './log';
import { store as reduxStore } from '~/lib/store/auxStore';
import database from '~/lib/database';

export async function hasPermission(permissions: (string[] | undefined)[], rid?: string): Promise<boolean[]> {
	let roomRoles: string[] = [];
	if (rid) {
		const db = database.active;
		const subsCollection = db.get('subscriptions');
		try {
			const room = await subsCollection.find(rid);
			roomRoles = room.roles || [];
		} catch (error) {
			console.log('hasPermission -> Room not found');
			return permissions.map(() => false);
		}
	}

	try {
		const loginUser = reduxStore.getState().login.user;
		const userRoles = loginUser?.roles || [];
		const mergedRoles = new Set([...roomRoles, ...userRoles]);
		return permissions.map(permission => permission?.some(r => mergedRoles.has(r)) ?? false);
	} catch (e) {
		log(e);
		return permissions.map(() => false);
	}
}
