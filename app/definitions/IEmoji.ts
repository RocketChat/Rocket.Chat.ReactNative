import Model from '@nozbe/watermelondb/Model';

export interface IFrequentlyUsedEmoji {
	content: string;
	extension?: string;
	isCustom: boolean;
	count?: number;
}

type TBasicEmoji = string;

export interface ICustomEmoji {
	// _id: string;
	name: string;
	// aliases?: string[];
	extension: string;
	// _updatedAt: Date;
}

export type IEmoji = ICustomEmoji | TBasicEmoji;

// TODO: why?
export interface ICustomEmojis {
	[key: string]: Pick<ICustomEmoji, 'name' | 'extension'>;
}

export type TGetCustomEmoji = (name: string) => any;

export type TFrequentlyUsedEmojiModel = IFrequentlyUsedEmoji & Model;
export type TCustomEmojiModel = {
	_id: string;
	name: string;
	aliases?: string[];
	extension: string;
	_updatedAt: Date;
} & Model;
