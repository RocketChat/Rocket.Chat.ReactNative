import type { IMessage, IMessageFromServer, IReadReceipts } from '../../IMessage';
import type { IServerRoom } from '../../IRoom';
import { PaginatedResult } from '../helpers/PaginatedResult';

export type ChatEndpoints = {
	'chat.getMessage': {
		GET: (params: { msgId: IMessage['_id'] }) => {
			message: IMessage;
		};
	};
	'chat.followMessage': {
		POST: (params: { mid: IMessage['_id'] }) => void;
	};
	'chat.unStarMessage': {
		POST: (params: { messageId: IMessage['_id'] }) => void;
	};
	'chat.starMessage': {
		POST: (params: { messageId: IMessage['_id'] }) => void;
	};
	'chat.unfollowMessage': {
		POST: (params: { mid: IMessage['_id'] }) => void;
	};
	'chat.unPinMessage': {
		POST: (params: { messageId: IMessage['_id'] }) => void;
	};
	'chat.pinMessage': {
		POST: (params: { messageId: IMessage['_id'] }) => void;
	};
	'chat.reportMessage': {
		POST: (params: { messageId: IMessage['_id']; description: string }) => void;
	};
	'chat.getDiscussions': {
		GET: (params: { roomId: IServerRoom['_id']; text?: string; offset: number; count: number }) => {
			messages: IMessageFromServer[];
			total: number;
			count: number;
		};
	};
	'chat.getThreadsList': {
		GET: (params: {
			rid: IServerRoom['_id'];
			type?: 'unread' | 'following' | 'all';
			text?: string;
			offset: number;
			count: number;
		}) => PaginatedResult<{
			threads: IMessage[];
			total: number;
		}>;
	};
	'chat.syncThreadsList': {
		GET: (params: { rid: IServerRoom['_id']; updatedSince: string }) => {
			threads: {
				update: IMessage[];
				remove: IMessage[];
			};
		};
	};
	'chat.delete': {
		POST: (params: { msgId: string; roomId: string }) => {
			_id: string;
			ts: string;
			message: Pick<IMessage, '_id' | 'rid' | 'u'>;
		};
	};
	'chat.react': {
		POST: (params: { emoji: string; messageId: string }) => void;
	};
	'chat.ignoreUser': {
		GET: (params: { rid: string; userId: string; ignore: boolean }) => {};
	};
	'chat.search': {
		GET: (params: { roomId: IServerRoom['_id']; searchText: string; count: number; offset: number }) => {
			messages: IMessageFromServer[];
		};
	};
	'chat.update': {
		POST: (params: { roomId: IServerRoom['_id']; msgId: string; text: string }) => {
			messages: IMessageFromServer;
		};
	};
	'chat.getMessageReadReceipts': {
		GET: (params: { messageId: string }) => { receipts: IReadReceipts[] };
	};
	'chat.postMessage': {
		POST: (params: { roomId: string; text: string }) => {
			message: IMessage;
			success: boolean;
		};
	};
};
