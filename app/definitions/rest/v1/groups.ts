import { ITeam } from '../../ITeam';
import type { IMessage, IMessageFromServer } from '../../IMessage';
import type { IRoom, IServerRoomItem } from '../../IRoom';
import type { IUser } from '../../IUser';

export type GroupsEndpoints = {
	'groups.files': {
		GET: (params: { roomId: IRoom['_id']; count: number; sort: string | { uploadedAt: number }; query: string }) => {
			files: IMessage[];
			total: number;
		};
	};
	'groups.members': {
		GET: (params: { roomId: IRoom['_id']; offset?: number; count?: number; filter?: string; status?: string[] }) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
	'groups.history': {
		GET: (params: { roomId: string; count: number; latest?: string }) => {
			messages: IMessageFromServer[];
		};
	};
	'groups.archive': {
		POST: (params: { roomId: string }) => void;
	};
	'groups.unarchive': {
		POST: (params: { roomId: string }) => void;
	};
	'groups.create': {
		POST: (params: {
			name: string;
			members: string[];
			readOnly: boolean;
			extraData: {
				broadcast: boolean;
				encrypted: boolean;
				teamId?: string;
			};
		}) => {
			group: Partial<IServerRoomItem>;
		};
	};
	'groups.convertToTeam': {
		POST: (params: { roomId: string; roomName: string }) => { team: ITeam };
	};
	'groups.kick': {
		POST: (params: { roomId: string; userId: string }) => {};
	};
	'groups.delete': {
		POST: (params: { roomId: string }) => {};
	};
	'groups.leave': {
		POST: (params: { roomId: string }) => {};
	};
};
