import { type StyleProp } from 'react-native';
import { type ImageStyle } from 'expo-image';

import { type IAttachment } from '../../definitions';

export interface IMessageAttachments {
	attachments?: IAttachment[];
}

export interface IMessageAvatar {
	small?: boolean;
}

export interface IMessageEmoji {
	content: string;
	standardEmojiStyle: { fontSize: number };
	customEmojiStyle: StyleProp<ImageStyle>;
}

export interface IMessageRepliedThread {
	isHeader: boolean;
}
