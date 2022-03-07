import { ITeam } from '../../ITeam';
import type { IMessage, IMessageFromServer } from '../../IMessage';
import type { IRoom, IServerRoomItem } from '../../IRoom';
import type { IUser } from '../../IUser';

export type ChannelsEndpoints = {
	'channels.files': {
		GET: (params: {
			roomId: IRoom['_id'];
			offset: number;
			count: number;
			sort: string | { uploadedAt: number };
			query: string;
		}) => {
			files: IMessage[];
			total: number;
		};
	};
	'channels.members': {
		GET: (params: { roomId: IRoom['_id']; offset?: number; count?: number; filter?: string; status?: string[] }) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
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
			group: Partial<IServerRoomItem>;
		};
	};
	'channels.convertToTeam': {
		POST: (params: { channelId: string; channelName: string }) => { team: ITeam };
	};
	'channels.delete': {
		POST: (params: { roomId: string }) => {};
	};
	'channels.leave': {
		POST: (params: { roomId: string }) => {};
	};
};
