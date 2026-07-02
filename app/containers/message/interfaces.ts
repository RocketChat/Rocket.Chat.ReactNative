import { type StyleProp } from 'react-native';
import { type ImageStyle } from 'expo-image';

import { type TGetCustomEmoji } from '../../definitions/IEmoji';
import { type IAttachment, type IUserMessage } from '../../definitions';

export interface IMessageAttachments {
	attachments?: IAttachment[];
	author?: IUserMessage;
}

export interface IMessageAvatar {
	small?: boolean;
}

export interface IMessageContent {
	tmid?: string;
	isIgnored: boolean;
}

export interface IMessageEmoji {
	content: string;
	standardEmojiStyle: { fontSize: number };
	customEmojiStyle: StyleProp<ImageStyle>;
	getCustomEmoji: TGetCustomEmoji;
}

export interface IMessageRepliedThread {
	isHeader: boolean;
}
