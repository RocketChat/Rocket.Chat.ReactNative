import { createContext, useContext, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { type TGetCustomEmoji } from '../../definitions/IEmoji';
import { type IAttachment, type TAnyMessageModel } from '../../definitions';
import { type IRoomInfoParam } from '../../views/SearchMessagesView';

export type MessageRoomState = {
	// stable handlers
	getCustomEmoji?: TGetCustomEmoji;
	navToRoomInfo?: (navParam: IRoomInfoParam) => void;
	showAttachment?: (file: IAttachment) => void;
	blockAction?: (params: { actionId: string; appId: string; value: string; blockId: string; rid: string; mid: string }) => void;
	handleEnterCall?: () => void;
	fetchThreadName?: (tmid: string, id: string) => Promise<string | undefined>;
	toggleFollowThread?: (isFollowingThread: boolean, tmid?: string) => Promise<void>;
	jumpToMessage?: (link: string) => void;
	closeEmojiAndAction?: (action?: Function, params?: any) => void;
	// row action handlers
	onReactionPress?: (emoji: string, id: string) => void;
	onReactionLongPress?: (item: TAnyMessageModel) => void;
	reactionInit?: (messageId: string) => void;
	onDiscussionPress?: (item: TAnyMessageModel) => void;
	onThreadPress?: (item: TAnyMessageModel) => void;
	replyBroadcast?: (item: TAnyMessageModel) => void;
	errorActionsShow?: (item: TAnyMessageModel) => void;
	onAnswerButtonPress?: Function;
	onEncryptedPress?: () => void;
	archived?: boolean;
	// room constants
	rid?: string;
	user?: { id?: string; username?: string; token?: string };
	baseUrl?: string;
	broadcast?: boolean;
	isThreadRoom?: boolean;
	Message_GroupingPeriod?: number;
	timeFormat?: string;
	// reactive tail (provider keeps current)
	autoTranslateRoom?: boolean;
	autoTranslateLanguage?: string;
};

// The room-scoped fields this store owns. Tests and stories use pickMessageRoomState to
// derive MessageRoomProvider props from a single fixture object. Add a field to
// MessageRoomState → add its key here.
const ROOM_STATE_KEYS: (keyof MessageRoomState)[] = [
	'getCustomEmoji',
	'navToRoomInfo',
	'showAttachment',
	'blockAction',
	'handleEnterCall',
	'fetchThreadName',
	'toggleFollowThread',
	'jumpToMessage',
	'closeEmojiAndAction',
	'onReactionPress',
	'onReactionLongPress',
	'reactionInit',
	'onDiscussionPress',
	'onThreadPress',
	'replyBroadcast',
	'errorActionsShow',
	'onAnswerButtonPress',
	'onEncryptedPress',
	'archived',
	'rid',
	'user',
	'baseUrl',
	'broadcast',
	'isThreadRoom',
	'Message_GroupingPeriod',
	'timeFormat',
	'autoTranslateRoom',
	'autoTranslateLanguage'
];

export const pickMessageRoomState = (source: Record<string, any> = {}): Partial<MessageRoomState> => {
	const state: Partial<MessageRoomState> = {};
	ROOM_STATE_KEYS.forEach(key => {
		if (source[key] !== undefined) {
			(state as Record<string, unknown>)[key] = source[key];
		}
	});
	return state;
};

export const createMessageRoomStore = (initial: MessageRoomState) => createStore<MessageRoomState>(() => ({ ...initial }));

export type MessageRoomStore = ReturnType<typeof createMessageRoomStore>;

export const MessageRoomStoreContext = createContext<MessageRoomStore | null>(null);

const useMessageRoomStore = <T,>(selector: (state: MessageRoomState) => T): T => {
	const store = useContext(MessageRoomStoreContext);
	if (!store) {
		throw new Error('Message room hooks must be used within a MessageRoomProvider');
	}
	return useStore(store, selector);
};

export const MessageRoomProvider = ({ children, ...state }: { children: ReactNode } & MessageRoomState): ReactElement => {
	'use memo';

	const [store] = useState(() => createMessageRoomStore(state));

	// No dependency array: the store must mirror the provider's props every render.
	// Handlers/constants are stable refs, so unchanged slices won't trigger a notify.
	useEffect(() => {
		store.setState(state);
	});

	return <MessageRoomStoreContext.Provider value={store}>{children}</MessageRoomStoreContext.Provider>;
};

export const useGetCustomEmoji = (): TGetCustomEmoji | undefined => useMessageRoomStore(s => s.getCustomEmoji);
export const useNavToRoomInfo = (): ((navParam: IRoomInfoParam) => void) | undefined => useMessageRoomStore(s => s.navToRoomInfo);
export const useShowAttachment = (): ((file: IAttachment) => void) | undefined => useMessageRoomStore(s => s.showAttachment);
export const useBlockAction = (): MessageRoomState['blockAction'] => useMessageRoomStore(s => s.blockAction);
export const useHandleEnterCall = (): (() => void) | undefined => useMessageRoomStore(s => s.handleEnterCall);
export const useFetchThreadName = (): MessageRoomState['fetchThreadName'] => useMessageRoomStore(s => s.fetchThreadName);
export const useToggleFollowThread = (): MessageRoomState['toggleFollowThread'] => useMessageRoomStore(s => s.toggleFollowThread);
export const useJumpToMessage = (): ((link: string) => void) | undefined => useMessageRoomStore(s => s.jumpToMessage);
export const useCloseEmojiAndAction = (): MessageRoomState['closeEmojiAndAction'] =>
	useMessageRoomStore(s => s.closeEmojiAndAction);

export const useOnReactionPress = (): MessageRoomState['onReactionPress'] => useMessageRoomStore(s => s.onReactionPress);
export const useOnReactionLongPress = (): MessageRoomState['onReactionLongPress'] =>
	useMessageRoomStore(s => s.onReactionLongPress);
export const useReactionInit = (): MessageRoomState['reactionInit'] => useMessageRoomStore(s => s.reactionInit);
export const useOnDiscussionPress = (): MessageRoomState['onDiscussionPress'] => useMessageRoomStore(s => s.onDiscussionPress);
export const useOnThreadPress = (): MessageRoomState['onThreadPress'] => useMessageRoomStore(s => s.onThreadPress);
export const useReplyBroadcast = (): MessageRoomState['replyBroadcast'] => useMessageRoomStore(s => s.replyBroadcast);
export const useErrorActionsShow = (): MessageRoomState['errorActionsShow'] => useMessageRoomStore(s => s.errorActionsShow);
export const useOnAnswerButtonPress = (): MessageRoomState['onAnswerButtonPress'] =>
	useMessageRoomStore(s => s.onAnswerButtonPress);
export const useOnEncryptedPress = (): MessageRoomState['onEncryptedPress'] => useMessageRoomStore(s => s.onEncryptedPress);
export const useArchived = (): boolean | undefined => useMessageRoomStore(s => s.archived);

export const useRid = (): string | undefined => useMessageRoomStore(s => s.rid);
export const useMessageUser = (): MessageRoomState['user'] => useMessageRoomStore(s => s.user);
export const useBaseUrl = (): string | undefined => useMessageRoomStore(s => s.baseUrl);
export const useBroadcast = (): boolean | undefined => useMessageRoomStore(s => s.broadcast);
export const useTimeFormat = (): string | undefined => useMessageRoomStore(s => s.timeFormat);
export const useIsThreadRoom = (): boolean | undefined => useMessageRoomStore(s => s.isThreadRoom);
export const useMessageGroupingPeriod = (): number | undefined => useMessageRoomStore(s => s.Message_GroupingPeriod);

export const useAutoTranslate = (): { autoTranslateRoom?: boolean; autoTranslateLanguage?: string } =>
	useMessageRoomStore(
		useShallow(s => ({ autoTranslateRoom: s.autoTranslateRoom, autoTranslateLanguage: s.autoTranslateLanguage }))
	);
