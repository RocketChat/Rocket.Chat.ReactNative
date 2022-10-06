import Model from '@nozbe/watermelondb/Model';

export interface ICustomEmoji {
	content: string;
	name: string;
	extension?: string;
	isCustom: boolean;
	count?: number;
}

type TBasicEmoji = string;

export type IEmoji = ICustomEmoji | TBasicEmoji;

export interface ICustomEmojis {
	[key: string]: Pick<ICustomEmoji, 'name' | 'extension'>;
}

export interface ICustomEmojiModel {
	_id: string;
	name?: string;
	aliases?: string[];
	extension: string;
	_updatedAt: Date;
}

export type TGetCustomEmoji = (name: string) => any;

export type TFrequentlyUsedEmojiModel = ICustomEmoji & Model;
export type TCustomEmojiModel = ICustomEmojiModel & Model;
