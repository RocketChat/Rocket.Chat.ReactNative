import { ITeam } from '../../ITeam';
import type { IMessageFromServer } from '../../IMessage';
import type { IServerRoom } from '../../IRoom';
import type { IUser } from '../../IUser';
import { IGetRoomRoles } from '../../IRole';
import { IServerAttachment } from '../../IAttachment';
import { PaginatedRequest } from '../helpers/PaginatedRequest';

export type ChannelsEndpoints = {
	'channels.files': {
		GET: (params: { roomId: IServerRoom['_id']; offset: number; sort: string | { uploadedAt: number } }) => {
			files: IServerAttachment[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'channels.members': {
		GET: (params: {
			roomId: IServerRoom['_id'];
			offset?: number;
			count?: number;
			filter?: boolean;
			status?: string[];
		}) => PaginatedRequest<{
			members: IUser[];
		}>;
	};
	'channels.history': {
		GET: (params: { roomId: string; count: number; latest?: string }) => {
			messages: IMessageFromServer[];
		};
	};
	'channels.archive': {
		POST: (params: { roomId: string }) => void;
	};
	'channels.unarchive': {
		POST: (params: { roomId: string }) => void;
	};
	'channels.create': {
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
	'channels.convertToTeam': {
		POST: (params: { channelId: string } | { channelName: string } | { channelId: string; channelName: string }) => {
			team: ITeam;
		};
	};
	'channels.info': {
		GET: (params: { roomId: string }) => { channel: IServerRoom };
	};
	'channels.counters': {
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
	'channels.join': {
		POST: (params: { roomId: string; joinCode: string | null }) => { channel: IServerRoom };
	};
	'channels.close': {
		POST: (params: { roomId: string }) => {};
	};
	'channels.kick': {
		POST: (params: { roomId: string; userId: string }) => {};
	};
	'channels.delete': {
		POST: (params: { roomId: string }) => {};
	};
	'channels.leave': {
		POST: (params: { roomId: string }) => {};
	};
	'channels.addModerator': {
		POST: (params: { roomId: string; userId: string }) => {};
	};
	'channels.removeModerator': {
		POST: (params: { roomId: string; userId: string }) => {};
	};
	'channels.addOwner': {
		POST: (params: { roomId: string; userId: string }) => {};
	};
	'channels.removeOwner': {
		POST: (params: { roomId: string; userId: string }) => {};
	};
	'channels.addLeader': {
		POST: (params: { roomId: string; userId: string }) => {};
	};
	'channels.removeLeader': {
		POST: (params: { roomId: string; userId: string }) => {};
	};
	'channels.roles': {
		GET: (params: { roomId: string }) => { roles: IGetRoomRoles[] };
	};
	'channels.messages': {
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
