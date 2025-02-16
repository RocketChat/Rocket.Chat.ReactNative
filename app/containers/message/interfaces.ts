import type { Root } from '@rocket.chat/message-parser';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { IUserChannel } from '../markdown/interfaces';
import type { TGetCustomEmoji } from '../../definitions/IEmoji';
import type { IAttachment, IThread, IUrl, IUserMention, IUserMessage, MessageType, TAnyMessageModel } from '../../definitions';
import type { IRoomInfoParam } from '../../views/SearchMessagesView';

export interface IMessageAttachments {
	attachments?: IAttachment[];
	timeFormat?: string;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
	showAttachment?: (file: IAttachment) => void;
	getCustomEmoji: TGetCustomEmoji;
	author?: IUserMessage;
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

export interface IBlockActionParams {
	actionId: string;
	appId?: string;
	value: string;
	blockId?: string;
	viewId?: string;
	rid?: string;
	mid?: string
};

export interface IBlockAction {
	(params: IBlockActionParams): Promise<void>;
}

export interface IBlock {
	appId?: string,
	type: string 
};

export interface IMessageBlocks {
	blocks: IBlock[];
	id: string;
	rid: string;
	blockAction?: IBlockAction;
}

export interface IMessageBroadcast {
	author?: IUserMessage;
	broadcast?: boolean;
}

export interface IMessageCallButton {
	handleEnterCall?: () => void;
}

export interface IMessageContent {
	_id: string;
	isTemp: boolean;
	isInfo: string | boolean;
	tmid?: string;
	isThreadRoom: boolean;
	msg?: string;
	md?: Root;
	isEdited: boolean;
	isEncrypted: boolean;
	getCustomEmoji: TGetCustomEmoji;
	channels?: IUserChannel[];
	mentions?: IUserMention[];
	navToRoomInfo: (navParam: IRoomInfoParam) => void;
	useRealName?: boolean;
	isIgnored: boolean;
	type: MessageType;
	comment?: string;
	hasError: boolean;
	isHeader: boolean;
	isTranslated: boolean;
	pinned?: boolean;
}

export interface IMessageEmoji {
	content: string;
	standardEmojiStyle: { fontSize: number };
	customEmojiStyle: StyleProp<ViewStyle>;
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
	type: MessageType;
	blocks: [];
	urls?: IUrl[];
	isPreview?: boolean;
}

export interface IMessage extends IMessageRepliedThread, IMessageInner, IMessageAvatar {
	isThreadReply: boolean;
	isThreadSequential: boolean;
	isInfo: string | boolean;
	isTemp: boolean;
	isHeader: boolean;
	hasError: boolean;
	style: any;
	// style: ViewStyle;
	onLongPress?: (item: TAnyMessageModel) => void;
	isReadReceiptEnabled?: boolean;
	unread?: boolean;
	isIgnored: boolean;
	dcount: number | undefined;
	dlm: string | Date | undefined;
}
