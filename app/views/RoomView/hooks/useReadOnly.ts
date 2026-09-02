import { type ISubscription } from '../../../definitions';
import { isReadOnlySync } from '../../../lib/methods/helpers/isReadOnly';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../selectors/login';
import { useRoomWithUpdate } from '../../../lib/store/RoomStoreContext';

export const useReadOnly = (): boolean => {
	const room = useRoomWithUpdate();
	const user = useAppSelector(getUserSelector);
	const postReadOnlyPermission = useAppSelector(state => state.permissions['post-readonly']);

	if (!('id' in room)) {
		return false;
	}

	return isReadOnlySync(room as Partial<ISubscription>, user.username as string, postReadOnlyPermission, user.roles ?? []);
};
