import { MarkdownAST } from '@rocket.chat/message-parser';
import { StyleProp, TextStyle } from 'react-native';

import { IUserChannel, IUserMention } from '../markdown/interfaces';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { IAttachment, IThread, IUrl, IUserMessage } from '../../definitions';
import { IRoomInfoParam } from '../../views/SearchMessagesView';

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
	avatar?: string;
	emoji?: string;
	author?: IUserMessage;
	small?: boolean;
	navToRoomInfo: (navParam: IRoomInfoParam) => void;
	getCustomEmoji: TGetCustomEmoji;
}

export interface IMessageBlocks {
	blocks: { appId?: string }[];
	id: string;
	rid: string;
	blockAction?: (params: { actionId: string; appId: string; value: string; blockId: string; rid: string; mid: string }) => void;
}

export interface IMessageBroadcast {
	author?: IUserMessage;
	broadcast: boolean;
}

export interface IMessageCallButton {
	callJitsi?: () => void;
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
	navToRoomInfo: (navParam: IRoomInfoParam) => void;
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
	urls?: IUrl[];
}

export interface IMessage extends IMessageRepliedThread, IMessageInner, IMessageAvatar {
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
