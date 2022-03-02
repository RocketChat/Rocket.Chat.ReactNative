import { IRoom } from '../../IRoom';

export type TeamsEndpoints = {
	'teams.removeRoom': {
		POST: (params: { roomId: string; teamId: string }) => { room: IRoom };
	};
	'teams.addRooms': {
		POST: (params: { teamId: string; rooms: string[] }) => { rooms: IRoom[] };
	};
};
