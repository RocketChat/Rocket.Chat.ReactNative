import { type Root } from '@rocket.chat/message-parser';
import { type StyleProp } from 'react-native';
import { type ImageStyle } from 'expo-image';

import { type IUserChannel } from '../markdown/interfaces';
import { type TGetCustomEmoji } from '../../definitions/IEmoji';
import {
	type IAttachment,
	type IThread,
	type IUrl,
	type IUserMention,
	type IUserMessage,
	type MessageType
} from '../../definitions';

export interface IMessageAttachments {
	attachments?: IAttachment[];
	timeFormat?: string;
	author?: IUserMessage;
}

export interface IMessageAvatar {
	isHeader: boolean;
	avatar?: string;
	emoji?: string;
	author?: IUserMessage;
	small?: boolean;
}

export interface IMessageBlocks {
	blocks?: { appId?: string }[];
	id: string;
	rid: string;
}

export interface IMessageBroadcast {
	author?: IUserMessage;
	broadcast?: boolean;
}

export interface IMessageContent {
	_id?: string;
	isTemp: boolean;
	isInfo: string | boolean;
	tmid?: string;
	isThreadRoom: boolean;
	msg?: string;
	md?: Root;
	isEdited: boolean;
	isEncrypted: boolean;
	channels?: IUserChannel[];
	mentions?: IUserMention[];
	useRealName?: boolean;
	isIgnored: boolean;
	type: MessageType;
	comment?: string;
	hasError: boolean;
	isHeader: boolean;
	isTranslated: boolean;
	pinned?: boolean;
	attachments?: IAttachment[];
	autoTranslateLanguage?: string;
	author?: IUserMessage;
	alias?: string;
	role?: string;
}

export interface IMessageEmoji {
	content: string;
	standardEmojiStyle: { fontSize: number };
	customEmojiStyle: StyleProp<ImageStyle>;
	getCustomEmoji: TGetCustomEmoji;
}

export interface IMessageThread extends Pick<IThread, 'msg' | 'tcount' | 'tlm' | 'id'> {
	isThreadRoom: boolean;
}

export interface IMessageTouchable {
	hasError: boolean;
	isInfo: string | boolean;
	isThreadReply: boolean;
	isTemp: boolean;
	archived?: boolean;
	highlighted?: boolean;
	ts?: string | Date;
	urls?: IUrl[];
	reactions?: any;
	alias?: string;
	role?: string;
	drid?: string;
	isBeingEdited?: boolean;
}

export interface IMessageRepliedThread extends Pick<IThread, 'tmid' | 'tmsg' | 'id'> {
	isHeader: boolean;
	isEncrypted: boolean;
}
