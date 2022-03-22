import { MarkdownAST } from '@rocket.chat/message-parser';
import { StyleProp, TextStyle } from 'react-native';

import { IUserChannel, IUserMention } from '../markdown/interfaces';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { IAttachment, IThread, SubscriptionType } from '../../definitions';

export type TMessageType = 'discussion-created' | 'jitsi_call_started';

export interface IMessageAttachments {
	attachments?: IAttachment[];
	timeFormat?: string;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
	showAttachment?: (file: IAttachment) => void;
	getCustomEmoji: TGetCustomEmoji;
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
	navToRoomInfo: (params: { t: SubscriptionType; rid: string }) => void;
	getCustomEmoji: TGetCustomEmoji;
}

export interface IMessageBlocks {
	blocks: { appId?: string }[];
	id: string;
	rid: string;
	blockAction?: (params: { actionId: string; appId: string; value: string; blockId: string; rid: string; mid: string }) => void;
}

export interface IMessageBroadcast {
	author: {
		_id: string;
	};
	broadcast: boolean;
}

export interface IMessageCallButton {
	callJitsi?: () => void;
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

export interface IMessageEmoji {
	content: any;
	baseUrl: string;
	standardEmojiStyle: object;
	customEmojiStyle: object;
	getCustomEmoji: TGetCustomEmoji;
}

export interface IMessageThread extends Pick<IThread, 'msg' | 'tcount' | 'tlm' | 'id'> {
	isThreadRoom: boolean;
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

export interface IMessageRepliedThread extends Pick<IThread, 'tmid' | 'tmsg' | 'id'> {
	isHeader: boolean;
	fetchThreadName?: (tmid: string, id: string) => Promise<string | undefined>;
	isEncrypted: boolean;
}

export interface IMessageInner
	extends IMessageContent,
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
