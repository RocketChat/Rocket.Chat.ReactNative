import type { IMessage } from '../../IMessage';
import type { IRoom } from '../../IRoom';
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
	'chat.getDiscussions': {
		GET: (params: { roomId: IRoom['_id']; text?: string; offset: number; count: number }) => {
			messages: IMessage[];
			total: number;
		};
	};
	'chat.getThreadsList': {
		GET: (params: {
			rid: IRoom['_id'];
			type: 'unread' | 'following' | 'all';
			text?: string;
			offset: number;
			count: number;
		}) => PaginatedResult<{
			threads: IMessage[];
			total: number;
		}>;
	};
	'chat.delete': {
		POST: (params: { msgId: string; roomId: string }) => {
			_id: string;
			ts: string;
			message: Pick<IMessage, '_id' | 'rid' | 'u'>;
		};
	};
};
