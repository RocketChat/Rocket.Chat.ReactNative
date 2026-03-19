import type { IMessage } from '@rocket.chat/core-typings';
import type { ChatEndpoints as RestTypingsChatEndpoints } from '@rocket.chat/rest-typings';

import type { EncryptedContent } from '../../IMessage';
import type { AdaptEndpoints } from '../adaptEndpoints';

type BaseChatEndpoints = AdaptEndpoints<RestTypingsChatEndpoints>;

export type ChatEndpoints = Omit<BaseChatEndpoints, 'chat.update' | 'chat.getThreadsList' | 'chat.syncThreadsList'> & {
	'chat.update': {
		POST: (
			params: { roomId: string; msgId: string; text: string } | { roomId: string; msgId: string; content: EncryptedContent }
		) => { message: IMessage };
	};
	'chat.getThreadsList': {
		GET: (params: { rid: string; count?: number; offset?: number; text?: string; type?: 'unread' | 'following' | 'all' }) => {
			threads: IMessage[];
			total: number;
		};
	};
	'chat.syncThreadsList': {
		GET: (params: { rid: string; updatedSince: string }) => {
			threads: { update: IMessage[]; remove: IMessage[] };
		};
	};
};
