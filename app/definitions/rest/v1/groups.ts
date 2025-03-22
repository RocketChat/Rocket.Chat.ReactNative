import { ITeam } from '../../ITeam';
import type { IMessageFromServer } from '../../IMessage';
import type { IServerRoom } from '../../IRoom';
import type { IUser } from '../../IUser';
import { IGetRoomRoles } from '../../IRole';
import { IServerAttachment } from '../../IAttachment';
import { PaginatedRequest } from '../helpers/PaginatedRequest';

export type GroupsEndpoints = {
	'groups.files': {
		GET: (params: { roomId: IServerRoom['_id']; offset: number; sort: string | { uploadedAt: number } }) => {
			files: IServerAttachment[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'groups.members': {
		GET: (params: {
			roomId: IServerRoom['_id'];
			offset?: number;
			count?: number;
			filter?: string;
			status?: string[];
		}) => PaginatedRequest<{
			members: IUser[];
		}>;
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
			group: Partial<IServerRoom>;
		};
	};
	'groups.convertToTeam': {
		POST: (params: { roomId: string; roomName: string }) => { team: ITeam };
	};
	'groups.counters': {
		GET: (params: { roomId: string }) => {
			joined: boolean;
			members: number;
			unreads: number;
			unreadsFrom: Date;
			msgs: number;
			latest: Date;
			userMentions: number;
		};
	};
	'groups.close': {
		POST: (params: { roomId: string }) => {};
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
	'groups.roles': {
		GET: (params: { roomId: string }) => { roles: IGetRoomRoles[] };
	};
	'groups.messages': {
		GET: (params: {
			roomId: IServerRoom['_id'];
			query: { 'mentions._id': { $in: string[] } } | { 'starred._id': { $in: string[] } } | { pinned: boolean };
			offset: number;
			sort: { ts: number };
		}) => {
			messages: IMessageFromServer[];
		};
	};
};
