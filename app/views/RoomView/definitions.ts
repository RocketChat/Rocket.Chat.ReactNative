import { type Ref, type RefObject } from 'react';
import { type FlatListProps } from 'react-native';
import { type FlatList } from 'react-native-gesture-handler';
import { type StoreApi } from 'zustand';

import { type ChatsStackParamList } from '../../stacks/types';
import {
	type IBaseScreen,
	type IEmoji,
	type IMessage,
	type IMessageEditAttachment,
	type RoomType,
	type TAnyMessageModel,
	type IUseRoomMessageHandlersResult
} from '../../definitions';
import { type TRoomOrPreview, type TRoomObservedFields } from '../../definitions/TRoom';
import { type RoomRead } from '../../lib/hooks/useRoomReadFromStore';
import { type RoomSnapshot } from '../../lib/roomObservation';
import { type TSubscriptionModel } from '../../definitions/ISubscription';
import { type TActionSheetOptions } from '../../containers/ActionSheet';
import { type IMessageComposerRef } from '../../containers/MessageComposer/interfaces';
import { type IMessageActions, type IMessageActionsProps } from '../../containers/MessageActions';
import { type IMessageErrorActions } from '../../containers/MessageErrorActions';
import { type TMessageActionStore } from '../../containers/message/stores/MessageActionStore';
import { type MessageRoomState } from '../../containers/message/stores/MessageRoomStore';

export type IRoomViewProps = Pick<IBaseScreen<ChatsStackParamList, 'RoomView'>, 'navigation' | 'route'>;

export interface IRoomScreenInput {
	rid: string;
	t: string;
	tmid?: string;
	name?: string;
	initialRoom: TRoomOrPreview;
	roomUserId?: string | null;
}

export type TRoomRouteParse = { status: 'valid'; input: IRoomScreenInput } | { status: 'invalid' };

export interface IRoomScreenProps extends Pick<IRoomViewProps, 'route'>, Pick<IRoomScreenInput, 'rid' | 't' | 'tmid'> {
	roomStore: RoomStore;
	ready: boolean;
}

export interface IRoomFooterProps {
	messageComposerRef: RefObject<IMessageComposerRef | null>;
	joinCodeRef: RefObject<IJoinCode | null>;
}

export type ITakeOrJoinProps = Pick<IRoomFooterProps, 'joinCodeRef'>;

export interface IFooterPreviewProps {
	message: string;
}

export interface IRoomViewState {
	room: TRoomOrPreview;
	member: any;
	lastSeen: Date | null;
}

export interface IUseE2EEStatusResult {
	showMissingE2EEKey: boolean;
	showE2EEDisabledRoom: boolean;
	hasE2EEWarning: boolean;
}

export type TListRef = RefObject<FlatList<TAnyMessageModel> | null>;

export type TMessagesIdsRef = RefObject<string[]>;

export interface IListProps extends FlatListProps<TAnyMessageModel> {
	flatListRef: TListRef;
	jumpToBottom: () => void;
	isAnchored?: boolean;
}

export interface IListContainerRef {
	jumpToMessage: (messageId: string, highTsMs?: number | null) => Promise<void>;
	cancelJumpToMessage: () => void;
	isMessageInWindow: (messageId: string) => boolean;
}

export interface IListContainerProps {
	onLongPress: (item: TAnyMessageModel) => void;
	rid: string;
	t: RoomType;
	tmid?: string;
	flatListRef: TListRef;
	hideSystemMessages: string[];
	showMessageInMainThread: boolean;
	serverVersion: string | null;
}

export type IRoomMessageHandlersInput = {
	tmid?: string;
	onThreadPress: IUseRoomMessageHandlersResult['onThreadPress'];
	onReactionPress: IUseRoomMessageHandlersResult['onReactionPress'];
	sendMessage: IUseRoomMessageHandlersResult['onAnswerButtonPress'];
};

export interface IRoomScreenContextValue {
	loading: boolean;
	failed: boolean;
	retry: () => void;
	lastSeen: IRoomViewState['lastSeen'];
	clearLastSeen: () => void;
}

export interface IRoomStoreInitParams {
	tmid?: string;
	onThreadMessagesLoaded?: () => void;
	signal?: AbortSignal;
}

export type TRoomInitResult =
	| { status: 'loaded'; lastSeen: IRoomViewState['lastSeen'] }
	| { status: 'skipped' }
	| { status: 'failed' };

export interface RoomState {
	room: RoomRead;
	roomSnapshot: RoomSnapshot;
	observedValues: TRoomObservedFields;
	joined: boolean;
	subscribed: boolean;
	member: IRoomViewState['member'];
	roomUserId?: string | null;
	canAutoTranslate: boolean;
	canForwardGuest: boolean;
	canViewCannedResponse: boolean;
	lastMessageFromAgent: boolean;
	init: (params?: IRoomStoreInitParams) => Promise<TRoomInitResult>;
	join: () => void;
	joinRoom: (requestJoinCode?: () => void) => Promise<void>;
	resumeRoom: () => Promise<void>;
}

export interface IJoinRoomContext {
	requestJoinCode?: () => void;
	onJoin: () => void;
}

export type RoomStore = StoreApi<RoomState>;

export type TGetMessageInfoResult = {
	id: string;
	rid: string | undefined;
	tmid?: string;
	msg: string | undefined;
	ts: string | Date | number;
	replies?: string[];
	fromServer?: boolean;
};

export interface AnchorMessage {
	id: string;
	t?: string | null;
	ts: Date | number | string;
}

export interface IJumpTarget {
	id: string;
	tmid?: string;
	ts: Date | number | string;
	fromServer?: boolean;
}

export interface IJumpAnchorDeps {
	loadSurroundingMessages: (params: { messageId: string; rid: string }) => Promise<unknown>;
	getLocalAnchorTs: (rid: string, ts: Date | number | string) => Promise<number | null>;
}

export type TMessageRowProps = {
	item: TAnyMessageModel;
	previousItem: TAnyMessageModel;
	highlightedMessage?: string;
	onLongPress: (item: TAnyMessageModel) => void;
};

export interface IJoinCodeProps {
	rid: string;
	t: string;
	onJoin: () => void;
	ref?: Ref<IJoinCode>;
}

export interface IJoinCode {
	show: () => void;
}

export interface IUseMessageActionsParams {
	messageActionStore: TMessageActionStore;
	showActionSheet: (options: TActionSheetOptions) => void;
	hideActionSheet: () => void;
	rid?: string;
	tmid?: string;
	onThreadPress: (item: TAnyMessageModel) => void;
	messageComposerRef: RefObject<IMessageComposerRef | null>;
	messageActionsRef: RefObject<IMessageActions | null>;
	messageErrorActionsRef: RefObject<IMessageErrorActions | null>;
}

export interface IUseMessageActionsResult {
	resetAction: () => void;
	handleCloseEmoji: (action?: (params?: unknown) => void, params?: unknown) => void;
	errorActionsShow: (message: TAnyMessageModel) => void;
	onEditInit: (messageId: string) => void;
	onEditCancel: () => void;
	onEditRequest: (
		message: Pick<IMessage, 'id' | 'msg' | 'rid'> & {
			attachments?: IMessageEditAttachment[];
		}
	) => Promise<void>;
	onQuoteInit: (messageId: string) => void;
	onRemoveQuoteMessage: (messageId: string) => void;
	onReactionPress: (emoji: IEmoji, messageId: string) => Promise<void>;
	onReactionInit: (messageId: string) => void;
	onMessageLongPress: (message: TAnyMessageModel) => void;
	onReplyInit: (messageId: string) => Promise<void>;
}

export interface IRoomMessageListProps
	extends
		Pick<MessageRoomState, 'jumpToMessage' | 'closeEmojiAndAction' | 'reactionInit' | 'errorActionsShow'>,
		Pick<IRoomMessageHandlersInput, 'onThreadPress' | 'onReactionPress' | 'sendMessage'> {
	tmid?: string;
	listContainerRef: RefObject<IListContainerRef | null>;
	flatListRef: TListRef;
	onLongPress: IListContainerProps['onLongPress'];
}

export type IRoomMessageActionsProps = Pick<
	IMessageActionsProps,
	'editInit' | 'replyInit' | 'quoteInit' | 'reactionInit' | 'onReactionPress' | 'jumpToMessage'
> & {
	tmid?: string;
	messageActionsRef: RefObject<IMessageActions | null>;
	messageErrorActionsRef: RefObject<IMessageErrorActions | null>;
};

export interface IUseRoomMessagingParams {
	rid?: string;
	t?: string;
	tmid?: string;
	ready: boolean;
	roomStore: RoomStore;
	roomUserId?: string | null;
	quoteMessageId?: string;
}

export interface IUseSubscriptionUnreadsResult {
	tunread: string[];
	tunreadUser: string[];
	tunreadGroup: string[];
	isSelfDm: boolean;
	subscription?: TSubscriptionModel;
}

export interface IUseRoomNavigationParams {
	rid?: string;
	tmid?: string;
	t?: string;
	isMasterDetail: boolean;
	listContainerRef: RefObject<IListContainerRef | null>;
	roomUserIdRef: RefObject<string | null | undefined>;
}

export interface IUseRoomNavigationResult {
	onThreadMessagesLoaded: () => void;
	onThreadPress: (item: TAnyMessageModel) => void;
	jumpToMessageByUrl: (messageUrl?: string, isFromReply?: boolean) => Promise<void>;
}

export interface IUseOmnichannelPermissionsParams {
	rid?: string;
	t?: string;
	roomStore: RoomStore;
}
