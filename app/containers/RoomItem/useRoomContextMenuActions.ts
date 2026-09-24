import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { getRoomActionsOptions, type IRoomActionsParams } from './getRoomActionsOptions';

export const useRoomContextMenuActions = (params: Omit<IRoomActionsParams, 'serverVersion'>) => {
	const serverVersion = useAppSelector(state => state.server.version);
	return getRoomActionsOptions({
		rid: params.rid,
		type: params.type,
		isRead: params.isRead,
		favorite: params.favorite,
		serverVersion
	});
};
