import Model from '@nozbe/watermelondb/Model';
import { Root } from '@rocket.chat/message-parser';

import { MessageTypeLoad } from '../lib/constants';
import { IAttachment } from './IAttachment';
import { IReaction } from './IReaction';
import { TThreadMessageModel } from './IThreadMessage';
import { TThreadModel } from './IThread';
import { IUrl, IUrlFromServer } from './IUrl';

export type TMessageAction = 'quote' | 'edit' | 'react' | null;

export type MessageType =
	| 'jitsi_call_started'
	| 'discussion-created'
	| 'e2e'
	| 'load_more'
	| 'rm'
	| 'uj'
	| MessageTypeLoad
	| MessageTypesValues;

export interface IUserMessage {
	_id: string;
	username?: string;
	name?: string;
}

export interface IUserMention extends IUserMessage {
	type: string;
}

export interface IUserChannel {
	[index: number]: string | number;
	name: string;
	_id: string;
}

export interface IEditedBy {
	_id: string;
	username: string;
}

export type TOnLinkPress = (link: string) => void;

export interface IMessageTranslations {
	_id: string;
	language: string;
	value: string;
}

export type E2EType = 'pending' | 'done';

export interface ILastMessage {
	_id?: string;
	rid?: string;
	tshow?: boolean;
	t?: MessageType;
	tmid?: string;
	msg?: string;
	e2e?: E2EType;
	ts?: string | Date;
	u: IUserMessage;
	_updatedAt?: string | Date;
	urls?: IUrlFromServer[];
	mentions?: IUserMention[];
	channels?: IUserChannel[];
	md?: Root;
	attachments?: IAttachment[];
	reactions?: IReaction[];
	unread?: boolean;
	pinned?: boolean;
	status?: number;
	token?: string;
}

interface IMessageFile {
	_id: string;
	name: string;
	type: string;
}

export type IMessageE2EEContent = {
	algorithm: 'rc.v1.aes-sha2';
	ciphertext: string; // Encrypted subset JSON of IMessage
};

export interface IMessageFromServer {
	_id: string;
	rid: string;
	msg?: string;
	ts: string | Date; // wm date issue
	u: IUserMessage;
	_updatedAt: string | Date;
	urls?: IUrl[];
	mentions?: IUserMention[];
	channels?: IUserChannel[];
	md?: Root;
	file?: IMessageFile;
	files?: IMessageFile[];
	groupable?: boolean;
	attachments?: IAttachment[];
	t?: MessageType;
	drid?: string;
	dcount?: number;
	dml: string | Date;
	starred?: boolean;
	pinned?: boolean;
	pinnedAt?: string | Date;
	pinnedBy?: {
		_id: string;
		username: string;
	};
	score?: number;
	content?: IMessageE2EEContent;
}

export interface ILoadMoreMessage {
	_id: string;
	rid: string;
	ts: string;
	t: string;
	msg: string;
}

export interface IMessage extends IMessageFromServer {
	id: string;
	t: MessageType;
	alias?: string;
	parseUrls?: boolean;
	avatar?: string;
	emoji?: string;
	status?: number;
	pinned?: boolean;
	editedBy?: IEditedBy;
	reactions?: IReaction[];
	role?: string;
	drid?: string;
	dcount?: number;
	dlm?: string | Date;
	tmid?: string;
	tcount?: number | null;
	tlm?: string | Date | null;
	replies?: string[];
	unread?: boolean;
	autoTranslate?: boolean;
	translations?: IMessageTranslations[];
	tmsg?: string;
	blocks?: any;
	e2e?: E2EType;
	tshow?: boolean;
	comment?: string;
	subscription?: { id: string };
	user?: string;
	editedAt?: string | Date;
}

export type TMessageModel = IMessage &
	Model & {
		asPlain: () => IMessage;
	};

export type TAnyMessageModel = TMessageModel | TThreadModel | TThreadMessageModel;
export type TTypeMessages = IMessageFromServer | ILoadMoreMessage | IMessage;

// Read receipts to ReadReceiptView and chat.getMessageReadReceipts
export interface IReadReceipts {
	_id: string;
	roomId: string;
	userId: string;
	messageId: string;
	ts: string;
	user?: IUserMessage;
}

// from Rocket.Chat codebase
type VoipMessageTypesValues =
	| 'voip-call-started'
	| 'voip-call-declined'
	| 'voip-call-on-hold'
	| 'voip-call-unhold'
	| 'voip-call-ended'
	| 'voip-call-duration'
	| 'voip-call-wrapup'
	| 'voip-call-ended-unexpectedly';

type TeamMessageTypes =
	| 'removed-user-from-team'
	| 'added-user-to-team'
	| 'ult'
	| 'user-converted-to-team'
	| 'user-converted-to-channel'
	| 'user-removed-room-from-team'
	| 'user-deleted-room-from-team'
	| 'user-added-room-to-team'
	| 'ujt';

type LivechatMessageTypes =
	| 'livechat_navigation_history'
	| 'livechat_transfer_history'
	| 'livechat_transcript_history'
	| 'livechat_video_call'
	| 'livechat_webrtc_video_call'
	| 'livechat-started';

type OmnichannelTypesValues =
	| 'livechat_transfer_history_fallback'
	| 'livechat-close'
	| 'omnichannel_placed_chat_on_hold'
	| 'omnichannel_on_hold_chat_resumed';

type OtrMessageTypeValues = 'otr' | 'otr-ack';
type OtrSystemMessages = 'user_joined_otr' | 'user_requested_otr_key_refresh' | 'user_key_refreshed_successfully';

export type MessageTypesValues =
	| 'e2e'
	| 'uj'
	| 'ul'
	| 'ru'
	| 'au'
	| 'mute_unmute'
	| 'r'
	| 'ut'
	| 'wm'
	| 'rm'
	| 'subscription-role-added'
	| 'subscription-role-removed'
	| 'room-archived'
	| 'room-unarchived'
	| 'room_changed_privacy'
	| 'room_changed_description'
	| 'room_changed_announcement'
	| 'room_changed_avatar'
	| 'room_changed_topic'
	| 'room_e2e_enabled'
	| 'room_e2e_disabled'
	| 'user-muted'
	| 'user-unmuted'
	| 'room-removed-read-only'
	| 'room-set-read-only'
	| 'room-allowed-reacting'
	| 'room-disallowed-reacting'
	| 'command'
	| 'videoconf'
	| LivechatMessageTypes
	| TeamMessageTypes
	| VoipMessageTypesValues
	| OmnichannelTypesValues
	| OtrMessageTypeValues
	| OtrSystemMessages
	| 'message_pinned'
	| 'message_snippeted'
	| 'jitsi_call_started';

export interface IAttachmentTranslations {
	[k: string]: string;
}
