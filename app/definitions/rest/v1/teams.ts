import { IRoom, IServerRoomItem } from '../../IRoom';

export type TeamsEndpoints = {
	'teams.removeRoom': {
		POST: (params: { roomId: string; teamId: string }) => { room: IRoom };
	};
	'teams.listRoomsOfUser': {
		GET: (params: { teamId: string; userId: string }) => {
			rooms: IServerRoomItem[];
			total: number;
			count: number;
			offset: number;
		};
	};
};
