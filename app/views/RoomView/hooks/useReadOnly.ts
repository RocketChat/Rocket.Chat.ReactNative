import { type ISubscription } from '../../../definitions';
import { isReadOnlySync } from '../../../lib/methods/helpers/isReadOnly';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../selectors/login';
import { getRoom, type RoomSnapshot } from '../../../lib/roomObservation';
import { useRoom } from '../stores/RoomStoreContext';

const getReadOnly = (
	snapshot: RoomSnapshot,
	username: string,
	postReadOnlyPermission: string[] | undefined,
	userRoles: string[]
): boolean => {
	const room = getRoom(snapshot);
	if (!('id' in room)) {
		return false;
	}
	return isReadOnlySync(room as Partial<ISubscription>, username, postReadOnlyPermission, userRoles);
};

export const useReadOnly = (): boolean => {
	const { snapshot } = useRoom();
	const user = useAppSelector(getUserSelector);
	const postReadOnlyPermission = useAppSelector(state => state.permissions['post-readonly']);

	return getReadOnly(snapshot, user.username as string, postReadOnlyPermission, user.roles ?? []);
};
