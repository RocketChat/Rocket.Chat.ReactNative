import Model from '@nozbe/watermelondb/Model';

export interface IFrequentlyUsedEmoji {
	content: string;
	extension?: string;
	isCustom: boolean;
	count?: number;
}

type TBasicEmoji = string;

export interface ICustomEmoji {
	name: string;
	extension: string;
}

export type IEmoji = ICustomEmoji | TBasicEmoji;

export interface ICustomEmojis {
	[key: string]: ICustomEmoji;
}

export type TGetCustomEmoji = (name: string) => ICustomEmoji | null;

export type TFrequentlyUsedEmojiModel = IFrequentlyUsedEmoji & Model;

export interface ICustomEmojiModel {
	_id: string;
	name: string;
	aliases?: string[];
	extension: string;
	_updatedAt: Date;
}

export type TCustomEmojiModel = ICustomEmojiModel & Model;
