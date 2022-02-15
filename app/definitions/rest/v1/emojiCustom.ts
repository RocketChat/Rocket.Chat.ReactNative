import type { ICustomEmojiDescriptor } from '../../ICustomEmojiDescriptor';
import { PaginatedRequest } from '../helpers/PaginatedRequest';
import { PaginatedResult } from '../helpers/PaginatedResult';

export type EmojiCustomEndpoints = {
	'emoji-custom.all': {
		GET: (params: PaginatedRequest<{ query: string }, 'name'>) => {
			emojis: ICustomEmojiDescriptor[];
		} & PaginatedResult;
	};
	'emoji-custom.list': {
		GET: (params: { query: string }) => {
			emojis?: {
				update: ICustomEmojiDescriptor[];
			};
		};
	};
	'emoji-custom.delete': {
		POST: (params: { emojiId: ICustomEmojiDescriptor['_id'] }) => void;
	};
};
