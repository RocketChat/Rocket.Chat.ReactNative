import { IRoom, IServerRoomItem } from '../../IRoom';
import { IServerTeamUpdateRoom, ITeam, TEAM_TYPE } from '../../ITeam';

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
	'teams.updateRoom': {
		POST: (params: { roomId: string; isDefault: boolean }) => { room: IServerTeamUpdateRoom };
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
