import { type IRoomViewState } from '../definitions';

export const getRoomHeaderFields = (
	room: IRoomViewState['room']
): { teamMain: boolean; encrypted?: boolean; departmentId?: string } => ({
	teamMain: 'teamMain' in room ? !!room.teamMain : false,
	encrypted: 'encrypted' in room ? room.encrypted : undefined,
	departmentId: 'id' in room ? room.departmentId : undefined
});
