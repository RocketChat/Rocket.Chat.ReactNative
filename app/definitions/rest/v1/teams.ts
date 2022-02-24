import { IRoom } from '../../IRoom';
import { IServerTeamUpdateRoom } from '../../ITeam';

export type TeamsEndpoints = {
	'teams.removeRoom': {
		POST: (params: { roomId: string; teamId: string }) => { room: IRoom };
	};
	'teams.updateRoom': {
		POST: (params: { roomId: string; isDefault: boolean }) => { room: IServerTeamUpdateRoom };
	};
};
