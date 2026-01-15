import type { ChatEndpoints as RestTypingsChatEndpoints } from '@rocket.chat/rest-typings';

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptChatEndpoints<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
};

export type ChatEndpoints = AdaptChatEndpoints<RestTypingsChatEndpoints>;
