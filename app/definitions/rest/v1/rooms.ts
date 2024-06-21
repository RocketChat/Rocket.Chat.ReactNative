import type { IMessage } from '../../IMessage';
import type { IRoomNotifications, IServerRoom } from '../../IRoom';
import type { IUser } from '../../IUser';

export type RoomsEndpoints = {
	'rooms.autocomplete.channelAndPrivate': {
		GET: (params: { selector: string }) => {
			items: IServerRoom[];
		};
	};
	'rooms.autocomplete.channelAndPrivate.withPagination': {
		GET: (params: { selector: string; offset?: number; count?: number; sort?: string }) => {
			items: IServerRoom[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'rooms.autocomplete.availableForTeams': {
		GET: (params: { name: string }) => {
			items: IServerRoom[];
		};
	};
	'rooms.info': {
		GET: (params: { roomId: string } | { roomName: string }) => {
			room: IServerRoom;
		};
	};
	'rooms.createDiscussion': {
		POST: (params: {
			prid: IServerRoom['_id'];
			pmid?: IMessage['_id'];
			t_name: IServerRoom['fname'];
			users?: IUser['username'][];
			encrypted?: boolean;
			reply?: string;
		}) => {
			discussion: IServerRoom;
		};
	};
	'rooms.favorite': {
		POST: (params: { roomId: string; favorite: boolean }) => {};
	};
	'rooms.saveNotification': {
		POST: (params: { roomId: string; notifications: IRoomNotifications }) => {};
	};
};

export type TRoomsMediaResponse = {
	file: { _id: string; url: string };
};
