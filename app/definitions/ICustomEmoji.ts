import Model from '@nozbe/watermelondb/Model';

export interface ICustomEmoji {
	_id: string;
	name?: string;
	aliases?: string[];
	extension: string;
	_updatedAt: Date;
}

export type TCustomEmojiModel = ICustomEmoji & Model;
