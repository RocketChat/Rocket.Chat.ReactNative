import { IRoom } from '../../IRoom';
import { ITeam, TEAM_TYPE } from '../../ITeam';

export type TeamsEndpoints = {
	'teams.removeRoom': {
		POST: (params: { roomId: string; teamId: string }) => { room: IRoom };
	};
	'teams.addRooms': {
		POST: (params: { teamId: string; rooms: string[] }) => { rooms: IRoom[] };
	};
	'teams.create': {
		POST: (params: {
			name: string;
			users: string[];
			type: TEAM_TYPE;
			room: { readOnly: boolean; extraData: { broadcast: boolean; encrypted: boolean } };
		}) => { team: ITeam };
	};
};
