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
	type MessageType,
	type TAnyMessageModel
} from '../../definitions';
import { type IRoomInfoParam } from '../../views/SearchMessagesView';

export interface IMessageAttachments {
	attachments?: IAttachment[];
	timeFormat?: string;
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

export interface IMessageBlocks {
	blocks: { appId?: string }[];
	id: string;
	rid: string;
	blockAction?: (params: { actionId: string; appId: string; value: string; blockId: string; rid: string; mid: string }) => void;
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
	highlights?: string[];
	pinned?: boolean;
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
	onLongPress?: (item: TAnyMessageModel) => void;
	isReadReceiptEnabled?: boolean;
	unread?: boolean;
	isIgnored: boolean;
	dcount: number | undefined;
	dlm: string | Date | undefined;
}
