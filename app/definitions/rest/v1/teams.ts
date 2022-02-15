import { IRoom } from '../../IRoom';

export type TeamsEndpoints = {
	'teams.removeRoom': {
		POST: (params: { roomId: string; teamId: string }) => { room: IRoom };
	};
};
