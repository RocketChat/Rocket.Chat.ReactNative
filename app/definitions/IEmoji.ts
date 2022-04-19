import Model from '@nozbe/watermelondb/Model';
import { StyleProp } from 'react-native';
import { ImageStyle } from '@rocket.chat/react-native-fast-image';

// TODO: evaluate unification with IEmoji
export interface IEmoji {
	content: string;
	name: string;
	extension: string;
	isCustom: boolean;
}

export interface ICustomEmoji {
	baseUrl?: string;
	emoji: IEmoji;
	style: StyleProp<ImageStyle>;
}

export interface ICustomEmojiModel {
	_id: string;
	name?: string;
	aliases?: string[];
	extension: string;
	_updatedAt: Date;
}

export interface IEmojiCategory {
	baseUrl: string;
	emojis: IEmoji[];
	onEmojiSelected: (emoji: IEmoji) => void;
	width: number | null;
	style: StyleProp<ImageStyle>;
	tabLabel: string;
}

// TODO: copied from reducers/customEmojis. We can unify later.
export interface IReduxEmoji {
	name: string;
	extension: any;
}

export type TGetCustomEmoji = (name: string) => any;

export type TFrequentlyUsedEmojiModel = IEmoji & Model;
export type TCustomEmojiModel = ICustomEmojiModel & Model;
