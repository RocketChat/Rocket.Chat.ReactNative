import { isReadOnlySync } from '../../../lib/methods/helpers/isReadOnly';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../selectors/login';
import { fromSubscription, useRoomStore } from '../stores/RoomStoreContext';

export const useReadOnly = (): boolean => {
	const user = useAppSelector(getUserSelector);
	const postReadOnlyPermission = useAppSelector(state => state.permissions['post-readonly']);

	return useRoomStore(
		fromSubscription(room => isReadOnlySync(room, user.username as string, postReadOnlyPermission, user.roles ?? []), false)
	);
};
