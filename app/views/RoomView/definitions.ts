import { type Ref, type RefObject } from 'react';
import { type FlatListProps } from 'react-native';
import { type FlatList } from 'react-native-gesture-handler';
import { type StoreApi } from 'zustand';

import { type ChatsStackParamList } from '../../stacks/types';
import {
	type IBaseScreen,
	type IEmoji,
	type ILastMessage,
	type IMessage,
	type IMessageEditAttachment,
	type IVisitor,
	type RoomType,
	type TAnyMessageModel,
	type TSubscriptionModel
} from '../../definitions';
import { type TActionSheetOptions } from '../../containers/ActionSheet';
import { type IMessageComposerRef } from '../../containers/MessageComposer/interfaces';
import { type IMessageActions, type IMessageActionsProps } from '../../containers/MessageActions';
import { type IMessageErrorActions } from '../../containers/MessageErrorActions';
import { type TMessageActionStore } from '../../containers/message/stores/MessageActionStore';
import { type MessageRoomState } from '../../containers/message/stores/MessageRoomStore';

export type IRoomViewProps = Pick<IBaseScreen<ChatsStackParamList, 'RoomView'>, 'navigation' | 'route'>;

export interface IRoomScreenProps extends Pick<IRoomViewProps, 'route'> {
	rid?: string;
	t?: string;
	tmid?: string;
	roomStore: RoomStore;
}

export interface IRoomFooterProps {
	messageComposerRef: RefObject<IMessageComposerRef | null>;
	joinCodeRef: RefObject<IJoinCode | null>;
}

export type ITakeOrJoinProps = Pick<IRoomFooterProps, 'joinCodeRef'>;

export interface IFooterPreviewProps {
	message: string;
}

export type TRoomUpdate = keyof TSubscriptionModel;

// The shapes the room screen reads off a subscription. The screen's own flags live with their
// owners: room-wide ones in RoomState, per-screen ones in IRoomScreenContextValue.
export interface IRoomViewState {
	room:
		| TSubscriptionModel
		| {
				rid: string;
				t: string;
				name?: string;
				fname?: string;
				prid?: string;
				visitor?: IVisitor;
				joinCodeRequired?: boolean;
				status?: string;
				lastMessage?: ILastMessage;
				sysMes?: boolean;
				onHold?: boolean;
		  };
	roomUpdate: Partial<Pick<TSubscriptionModel, TRoomUpdate>>;
	member: any;
	lastSeen: Date | null;
}

export type ComposerState = {
	rid?: string;
	t?: string;
	tmid?: string;
	room: IRoomViewState['room'];
	roomUpdate?: IRoomViewState['roomUpdate'];
	sharing?: boolean;
	isAutocompleteVisible: boolean;
	editCancel?: () => void;
	editRequest?: (message: Pick<IMessage, 'id' | 'msg' | 'rid'> & { attachments?: IMessageEditAttachment[] }) => Promise<void>;
	onRemoveQuoteMessage?: (messageId: string) => void;
	onSendMessage?: (message?: string, tshow?: boolean) => void;
	setQuotesAndText?: (text: string, quotes: string[]) => void;
	getText?: () => string | undefined;
	updateAutocompleteVisible: (updatedAutocompleteVisible: boolean) => void;
};

// The externally-suppliable slice of ComposerState — `isAutocompleteVisible`/`updateAutocompleteVisible`
// are store-owned (seeded internally by `createComposerStore`), not passed in by callers.
export type TComposerExternalState = Omit<ComposerState, 'isAutocompleteVisible' | 'updateAutocompleteVisible'>;

export interface IUseE2EEStatusResult {
	showMissingE2EEKey: boolean;
	showE2EEDisabledRoom: boolean;
}

export interface IJumpToMessageArgs {
	messageId: string;
	isFromReply?: boolean;
	rid?: string;
	tmid?: string;
	t?: string;
	listContainerRef: RefObject<IListContainerRef | null>;
	navToRoom: (message: TGetMessageInfoResult) => void | Promise<void>;
	navToThread: (message: TGetMessageInfoResult) => void | Promise<void>;
	cancel: () => void;
	isCancelled: () => boolean;
}

export type TListRef = RefObject<FlatList<TAnyMessageModel> | null>;

export type TMessagesIdsRef = RefObject<string[]>;

export interface IListProps extends FlatListProps<TAnyMessageModel> {
	flatListRef: TListRef;
	jumpToBottom: () => void;
	// Anchored Window: loaded rows' bottom isn't the Live Tail, so the scroll-offset
	// heuristic alone would hide the jump-to-bottom FAB. Keep it visible so "back to live" stays one tap.
	isAnchored?: boolean;
}

export interface IListContainerRef {
	// highTs: upper ts bound (ms) for an Anchored Window on the target's Chunk; null/undefined keeps a
	// Live Window (contiguous / thread / local targets).
	jumpToMessage: (messageId: string, highTs?: number | null) => Promise<void>;
	cancelJumpToMessage: () => void;
	// True when messageId is in the rendered window, so the orchestration skips re-anchoring for an
	// already-visible target (a quoted reply nearby scrolls in place, Live Tail intact).
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

export interface IRoomActions {
	onThreadPress: (item: TAnyMessageModel) => void;
	onReactionPress: (emoji: IEmoji, messageId: string) => Promise<void>;
	sendMessage: (message?: string, tshow?: boolean) => void;
}

// The screen's own state, carried by RoomScreenContext — see that module for why it is per-screen.
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
	// Per-run cancel token: a run whose signal aborts stops retrying and reports `skipped`, so a
	// superseded run can never write over the run that replaced it.
	signal?: AbortSignal;
}

// The distinct outcomes of one init() run. `skipped` means the run produced nothing the caller may
// act on: either no work was attempted (no rid, an invite subscription) or the run was aborted and
// abandoned, which can happen even after a successful load. Only `loaded` carries an unread divider
// anchor; `failed` means every attempt was made and none succeeded.
export type TRoomInitResult =
	| { status: 'loaded'; lastSeen: IRoomViewState['lastSeen'] }
	| { status: 'skipped' }
	| { status: 'failed' };

export interface RoomState {
	room: IRoomViewState['room'];
	roomUpdate: IRoomViewState['roomUpdate'];
	joined: boolean;
	subscribed: boolean;
	member: IRoomViewState['member'];
	roomUserId?: string | null;
	canAutoTranslate: boolean;
	canForwardGuest: boolean;
	canViewCannedResponse: boolean;
	lastMessageFromAgent: boolean;
	// Resolves with the run's outcome; only `loaded` carries the screen's unread divider anchor.
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

export interface IGetOrCreateRoomStoreParams {
	rid?: string;
	t?: string;
	initialRoom: IRoomViewState['room'];
	roomUserId?: string | null;
}

export type ComposerStore = StoreApi<ComposerState>;

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
	setQuotesAndText: (text: string, quotes: string[]) => void;
	getText: () => string | undefined;
}

export interface IRoomMessageListProps extends Pick<
	MessageRoomState,
	'jumpToMessage' | 'closeEmojiAndAction' | 'reactionInit' | 'errorActionsShow'
> {
	tmid?: string;
	listContainerRef: RefObject<IListContainerRef | null>;
	flatListRef: TListRef;
	onLongPress: IListContainerProps['onLongPress'];
	roomActions: IRoomActions;
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
	roomStore: RoomStore;
	roomUserId?: string | null;
	quoteMessageId?: string;
}

export interface IUseRoomMessagingResult {
	messageActionStore: TMessageActionStore;
	roomScreen: IRoomScreenContextValue;
	messageComposerRef: RefObject<IMessageComposerRef | null>;
	listContainerRef: RefObject<IListContainerRef | null>;
	flatListRef: TListRef;
	messageActionsRef: RefObject<IMessageActions | null>;
	messageErrorActionsRef: RefObject<IMessageErrorActions | null>;
	roomActions: IRoomActions;
	sendMessage: TComposerExternalState['onSendMessage'];
	jumpToMessage: IMessageActionsProps['jumpToMessage'];
	closeEmojiAndAction: IRoomMessageListProps['closeEmojiAndAction'];
	errorActionsShow: IRoomMessageListProps['errorActionsShow'];
	onMessageLongPress: IListContainerProps['onLongPress'];
	onEditInit: IMessageActionsProps['editInit'];
	onEditCancel: TComposerExternalState['editCancel'];
	onEditRequest: TComposerExternalState['editRequest'];
	onQuoteInit: IMessageActionsProps['quoteInit'];
	onRemoveQuoteMessage: TComposerExternalState['onRemoveQuoteMessage'];
	onReactionInit: IMessageActionsProps['reactionInit'];
	onReactionPress: IMessageActionsProps['onReactionPress'];
	onReplyInit: IMessageActionsProps['replyInit'];
	setQuotesAndText: TComposerExternalState['setQuotesAndText'];
	getText: TComposerExternalState['getText'];
}

export interface IUseSubscriptionUnreadsResult {
	tunread: string[];
	tunreadUser: string[];
	tunreadGroup: string[];
	isSelfDm: boolean;
	subscription?: TSubscriptionModel;
}

export interface IUseJumpToMessageParams {
	rid?: string;
	tmid?: string;
	t?: string;
	listContainerRef: RefObject<IListContainerRef | null>;
	navToRoom: (message: TGetMessageInfoResult) => void | Promise<void>;
	navToThread: (message: TGetMessageInfoResult | { tmid: string }) => void | Promise<void>;
}

export interface IUseJumpToMessageResult {
	jumpToMessage: (messageId: string, isFromReply?: boolean) => Promise<void>;
	cancelJumpToMessage: () => void;
	onThreadMessagesLoaded: () => void;
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
