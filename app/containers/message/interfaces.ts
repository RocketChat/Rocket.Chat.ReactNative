import { MarkdownAST } from '@rocket.chat/message-parser';

import { IUserChannel, IUserMention } from '../markdown/interfaces';
import { TGetCustomEmoji } from '../../definitions/IEmoji';

export type TMessageType = 'discussion-created' | 'jitsi_call_started';

export interface IMessageAttachments {
	attachments: any;
	timeFormat?: string;
	showAttachment: Function;
	getCustomEmoji: TGetCustomEmoji;
	theme: string;
}

export interface IMessageAttachedActions {
	attachment: {
		actions: [];
		text: string;
	};
	theme: string;
}

export interface IMessageAvatar {
	isHeader: boolean;
	avatar: string;
	emoji: string;
	author: {
		username: string;
		_id: string;
	};
	small?: boolean;
	navToRoomInfo: Function;
	getCustomEmoji: TGetCustomEmoji;
	theme: string;
}

export interface IMessageBlocks {
	blocks: any;
	id: string;
	rid: string;
	blockAction: Function;
}

export interface IMessageBroadcast {
	author: {
		_id: string;
	};
	broadcast: boolean;
	theme: string;
}

export interface IMessageCallButton {
	theme: string;
	callJitsi: Function;
}

export interface IUser {
	id: string;
	username: string;
	token: string;
	name: string;
}

export interface IMessageContent {
	_id: string;
	isTemp: boolean;
	isInfo: boolean;
	tmid?: string;
	isThreadRoom: boolean;
	msg?: string;
	md?: MarkdownAST;
	theme: string;
	isEdited: boolean;
	isEncrypted: boolean;
	getCustomEmoji: TGetCustomEmoji;
	channels?: IUserChannel[];
	mentions?: IUserMention[];
	navToRoomInfo?: Function;
	useRealName?: boolean;
	isIgnored: boolean;
	type: string;
}

export interface IMessageDiscussion {
	msg?: string;
	dcount?: number;
	dlm?: Date;
	theme: string;
}

export interface IMessageEmoji {
	content: any;
	baseUrl: string;
	standardEmojiStyle: object;
	customEmojiStyle: object;
	getCustomEmoji: TGetCustomEmoji;
}

export interface IMessageThread {
	msg?: string;
	tcount?: number;
	theme: string;
	tlm?: Date;
	isThreadRoom: boolean;
	id: string;
}

export interface IMessageTouchable {
	hasError: boolean;
	isInfo: boolean;
	isThreadReply: boolean;
	isTemp: boolean;
	archived: boolean;
	highlighted: boolean;
	theme: string;
	ts?: any;
	urls?: any;
	reactions?: any;
	alias?: any;
	role?: any;
	drid?: any;
}

export interface IMessageRepliedThread {
	tmid?: string;
	tmsg?: string;
	id: string;
	isHeader: boolean;
	theme: string;
	fetchThreadName: Function;
	isEncrypted: boolean;
}

export interface IMessageInner
	extends IMessageDiscussion,
		IMessageContent,
		IMessageCallButton,
		IMessageBlocks,
		IMessageThread,
		IMessageAttachments,
		IMessageBroadcast {
	type: TMessageType;
	blocks: [];
}

export interface IMessage extends IMessageRepliedThread, IMessageInner {
	isThreadReply: boolean;
	isThreadSequential: boolean;
	isInfo: boolean;
	isTemp: boolean;
	isHeader: boolean;
	hasError: boolean;
	style: any;
	onLongPress: Function;
	isReadReceiptEnabled: boolean;
	unread?: boolean;
	theme: string;
	isIgnored: boolean;
}
