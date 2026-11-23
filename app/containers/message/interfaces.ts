import { type StyleProp, type TextStyle } from 'react-native';
import { type ImageStyle } from 'expo-image';

import { type IAttachment } from '~/definitions/IAttachment';

export interface IMessageAttachments {
	attachments?: IAttachment[];
}

export interface IMessageAvatar {
	small?: boolean;
}

export interface IMessageEmoji {
	content: string;
	standardEmojiStyle: StyleProp<TextStyle>;
	customEmojiStyle: StyleProp<ImageStyle>;
}

export interface IMessageRepliedThread {
	isHeader: boolean;
}
