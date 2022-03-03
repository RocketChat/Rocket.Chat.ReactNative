import { IRoom } from '../../IRoom';
import { ITeam, TEAM_TYPE } from '../../ITeam';

export type TeamsEndpoints = {
	'teams.removeRoom': {
		POST: (params: { roomId: string; teamId: string }) => { room: IRoom };
	};
	'teams.convertToChannel': {
		POST: (params: { teamId: string; roomsToRemove?: string[] }) => {};
	};
	'teams.removeMember': {
		POST: (params: { teamId: string; userId: string; rooms?: string[] }) => {};
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
