import { store as reduxStore } from '../../store/auxStore';

/**
 * Returns true when `userId` equals the currently logged-in user's `_id`.
 * Used by VoIP UI and service guards to prevent initiating a call to oneself.
 * Compares by `_id` (not `username`) because `login.user` is `Partial<IUser>`
 * and `username` may be undefined in stale Redux state.
 */
export const isSelfUserId = (userId: string | null | undefined): boolean => {
	if (!userId) {
		return false;
	}
	const ownId = reduxStore.getState().login.user?.id;
	return !!ownId && userId === ownId;
};
