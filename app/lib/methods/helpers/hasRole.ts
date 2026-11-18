import { store as reduxStore } from '~/lib/store/auxStore';

export function hasRole(role: string): boolean {
	const loginUser = reduxStore.getState().login.user;
	const userRoles = loginUser?.roles || [];
	return userRoles.indexOf(role) > -1;
}
