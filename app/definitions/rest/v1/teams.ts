import { type IServerRoom } from '../../IRoom';
import { type IServerTeamUpdateRoom, type ITeam, type TEAM_TYPE } from '../../ITeam';
import { type PaginatedResult } from '../helpers/PaginatedResult';

export type TeamsEndpoints = {
	'teams.removeRoom': {
		POST: (params: { roomId: string; teamId: string }) => { room: IServerRoom };
	};
	'teams.listRoomsOfUser': {
		GET: (params: { teamId: string; userId: string }) => PaginatedResult<{ rooms: IServerRoom[] }>;
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
		POST: (params: { teamId: string; rooms: string[] }) => { rooms: IServerRoom[] };
	};
	'teams.create': {
		POST: (params: {
			name: string;
			members: string[];
			type: TEAM_TYPE;
			room: { readOnly: boolean; extraData: { broadcast: boolean; encrypted: boolean } };
		}) => { team: ITeam };
	};
	'teams.listRooms': {
		GET: (params: {
			teamId: string;
			count: number;
			offset: number;
			type: string;
			filter?: any;
		}) => PaginatedResult<{ rooms: IServerTeamUpdateRoom[] }>;
	};
};
