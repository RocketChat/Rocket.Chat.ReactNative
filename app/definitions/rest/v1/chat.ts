import type { IMessage } from '../../IMessage';
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
	'chat.unfollowMessage': {
		POST: (params: { mid: IMessage['_id'] }) => void;
	};
	'chat.getDiscussions': {
		GET: (params: { roomId: IServerRoom['_id']; text?: string; offset: number; count: number }) => {
			messages: IMessage[];
			total: number;
		};
	};
	'chat.getThreadsList': {
		GET: (params: {
			rid: IServerRoom['_id'];
			type: 'unread' | 'following' | 'all';
			text?: string;
			offset: number;
			count: number;
		}) => PaginatedResult<{
			threads: IMessage[];
			total: number;
		}>;
	};
};
