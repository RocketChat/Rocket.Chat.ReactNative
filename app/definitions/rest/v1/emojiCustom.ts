import type { EmojiCustomEndpoints as RestTypingsEmojiCustomEndpoints } from '@rocket.chat/rest-typings';

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptEmojiCustomEndpoints<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
};

export type EmojiCustomEndpoints = AdaptEmojiCustomEndpoints<RestTypingsEmojiCustomEndpoints>;
