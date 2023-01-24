import { TUserStatus } from '../../definitions';
import { useAppSelector } from '../../lib/hooks';
import { RoomTypes } from '../../lib/methods';

export const useUserStatus = (
	type: RoomTypes,
	liveChatStatus?: TUserStatus,
	id?: string
): { connected: boolean; status: TUserStatus } => {
	const connected = useAppSelector(state => state.meteor.connected);
	const userStatus = useAppSelector(state => state.activeUsers[id || '']?.status);
	let status = 'loading';
	if (connected) {
		if (type === 'd') {
			status = userStatus || 'loading';
		} else if (type === 'l' && liveChatStatus) {
			status = liveChatStatus;
		}
	}
	return {
		connected,
		status: status as TUserStatus
	};
};
