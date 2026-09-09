import { isReadOnlySync } from '../../../lib/methods/helpers/isReadOnly';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../selectors/login';
import { useRoomStore } from '../stores/RoomStoreContext';

export const useReadOnly = (): boolean => {
	const user = useAppSelector(getUserSelector);
	const postReadOnlyPermission = useAppSelector(state => state.permissions['post-readonly']);

	return useRoomStore(s => {
		const { room } = s;
		if (!('id' in room)) {
			return false;
		}
		return isReadOnlySync(room, user.username as string, postReadOnlyPermission, user.roles ?? []);
	});
};
