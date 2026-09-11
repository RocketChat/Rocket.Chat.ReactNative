import { createContext, useContext, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { type IUseRoomMessageHandlersResult, type IUser, type TAnyMessageModel } from '../../../definitions';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useLiveRef } from '../../../lib/hooks/useLiveRef';
import { useSetting } from '../../../lib/hooks/useSetting';
import { getUserSelector } from '../../../selectors/login';

type LiveCallbacks = {
	jumpToMessage?: (link: string) => void;
	closeEmojiAndAction?: (action?: (params?: unknown) => void, params?: unknown) => void;
	reactionInit?: (messageId: string) => void;
	errorActionsShow?: (item: TAnyMessageModel) => void;
};

export type MessageRoomState = LiveCallbacks & {
	handlers?: Partial<IUseRoomMessageHandlersResult>;
	rid?: string;
	isThreadRoom?: boolean;
	tmid?: string;
	archived?: boolean;
	broadcast?: boolean;
	isReadReceiptEnabled?: boolean;
	Message_GroupingPeriod?: number;
	timeFormat?: string;
	autoTranslateRoom?: boolean;
	autoTranslateLanguage?: string;
};

type MessageRoomSnapshot = { [K in keyof Required<MessageRoomState>]: MessageRoomState[K] };

type LiveCallbacksSnapshot = { [K in keyof Required<LiveCallbacks>]: LiveCallbacks[K] };

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

const useLiveCallbacks = (callbacks: LiveCallbacks): LiveCallbacksSnapshot => {
	const latest = useLiveRef(callbacks);
	const [wrappers] = useState<Required<LiveCallbacks>>(() => ({
		jumpToMessage: (...args) => latest.current.jumpToMessage?.(...args),
		closeEmojiAndAction: (...args) => latest.current.closeEmojiAndAction?.(...args),
		reactionInit: (...args) => latest.current.reactionInit?.(...args),
		errorActionsShow: (...args) => latest.current.errorActionsShow?.(...args)
	}));

	const hasJumpToMessage = !!callbacks.jumpToMessage;
	const hasCloseEmojiAndAction = !!callbacks.closeEmojiAndAction;
	const hasReactionInit = !!callbacks.reactionInit;
	const hasErrorActionsShow = !!callbacks.errorActionsShow;

	return useMemo(
		() => ({
			jumpToMessage: hasJumpToMessage ? wrappers.jumpToMessage : undefined,
			closeEmojiAndAction: hasCloseEmojiAndAction ? wrappers.closeEmojiAndAction : undefined,
			reactionInit: hasReactionInit ? wrappers.reactionInit : undefined,
			errorActionsShow: hasErrorActionsShow ? wrappers.errorActionsShow : undefined
		}),
		[wrappers, hasJumpToMessage, hasCloseEmojiAndAction, hasReactionInit, hasErrorActionsShow]
	);
};

export const MessageRoomProvider = ({ children, ...state }: { children: ReactNode } & MessageRoomState): ReactElement => {
	const timeFormatSetting = useSetting('Message_TimeFormat') as string;
	const timeFormat = state.timeFormat ?? timeFormatSetting;
	const callbacks = useLiveCallbacks(state);
	const [store] = useState(() => createMessageRoomStore({ ...state, ...callbacks, timeFormat }));

	useEffect(() => {
		const snapshot: MessageRoomSnapshot = {
			...callbacks,
			handlers: state.handlers,
			rid: state.rid,
			isThreadRoom: state.isThreadRoom,
			tmid: state.tmid,
			timeFormat,
			autoTranslateRoom: state.autoTranslateRoom,
			autoTranslateLanguage: state.autoTranslateLanguage,
			archived: state.archived,
			broadcast: state.broadcast,
			isReadReceiptEnabled: state.isReadReceiptEnabled,
			Message_GroupingPeriod: state.Message_GroupingPeriod
		};
		store.setState(snapshot);
	}, [
		callbacks,
		state.handlers,
		state.rid,
		state.isThreadRoom,
		state.tmid,
		timeFormat,
		state.autoTranslateRoom,
		state.autoTranslateLanguage,
		state.archived,
		state.broadcast,
		state.isReadReceiptEnabled,
		state.Message_GroupingPeriod,
		store
	]);

	return <MessageRoomStoreContext.Provider value={store}>{children}</MessageRoomStoreContext.Provider>;
};

export const useJumpToMessage = (): ((link: string) => void) | undefined => useMessageRoomStore(s => s.jumpToMessage);
export const useCloseEmojiAndAction = (): MessageRoomState['closeEmojiAndAction'] =>
	useMessageRoomStore(s => s.closeEmojiAndAction);

export const useReactionInit = (): MessageRoomState['reactionInit'] => useMessageRoomStore(s => s.reactionInit);
export const useErrorActionsShow = (): MessageRoomState['errorActionsShow'] => useMessageRoomStore(s => s.errorActionsShow);
export const useNavToRoomInfo = (): IUseRoomMessageHandlersResult['navToRoomInfo'] | undefined =>
	useMessageRoomStore(s => s.handlers?.navToRoomInfo);
export const useShowAttachment = (): IUseRoomMessageHandlersResult['showAttachment'] | undefined =>
	useMessageRoomStore(s => s.handlers?.showAttachment);
export const useBlockAction = (): IUseRoomMessageHandlersResult['blockAction'] | undefined =>
	useMessageRoomStore(s => s.handlers?.blockAction);
export const useHandleEnterCall = (): IUseRoomMessageHandlersResult['handleEnterCall'] | undefined =>
	useMessageRoomStore(s => s.handlers?.handleEnterCall);
export const useOnDiscussionPress = (): IUseRoomMessageHandlersResult['onDiscussionPress'] | undefined =>
	useMessageRoomStore(s => s.handlers?.onDiscussionPress);
export const useOnThreadPress = (): IUseRoomMessageHandlersResult['onThreadPress'] | undefined =>
	useMessageRoomStore(s => s.handlers?.onThreadPress);
export const useOnEncryptedPress = (): IUseRoomMessageHandlersResult['onEncryptedPress'] | undefined =>
	useMessageRoomStore(s => s.handlers?.onEncryptedPress);
export const useOnReactionPress = (): IUseRoomMessageHandlersResult['onReactionPress'] | undefined =>
	useMessageRoomStore(s => s.handlers?.onReactionPress);
export const useOnReactionLongPress = (): IUseRoomMessageHandlersResult['onReactionLongPress'] | undefined =>
	useMessageRoomStore(s => s.handlers?.onReactionLongPress);
export const useReplyBroadcast = (): IUseRoomMessageHandlersResult['replyBroadcast'] | undefined =>
	useMessageRoomStore(s => s.handlers?.replyBroadcast);
export const useFetchThreadName = (): IUseRoomMessageHandlersResult['fetchThreadName'] | undefined =>
	useMessageRoomStore(s => s.handlers?.fetchThreadName);
export const useToggleFollowThread = (): IUseRoomMessageHandlersResult['toggleFollowThread'] | undefined =>
	useMessageRoomStore(s => s.handlers?.toggleFollowThread);
export const useOnAnswerButtonPress = (): IUseRoomMessageHandlersResult['onAnswerButtonPress'] | undefined =>
	useMessageRoomStore(s => s.handlers?.onAnswerButtonPress);
export const useIsArchived = (): boolean | undefined => useMessageRoomStore(s => s.archived);
export const useIsReadReceiptEnabled = (): boolean | undefined => useMessageRoomStore(s => s.isReadReceiptEnabled);

export const useRid = (): string | undefined => useMessageRoomStore(s => s.rid);
export const useMessageUser = (): IUser => useAppSelector(getUserSelector);
export const useBaseUrl = (): string => useAppSelector(state => state.server.server);
export const useBroadcast = (): boolean | undefined => useMessageRoomStore(s => s.broadcast);
export const useTimeFormat = (): string | undefined => useMessageRoomStore(s => s.timeFormat);
export const useIsThreadRoom = (): boolean | undefined => useMessageRoomStore(s => s.isThreadRoom);
export const useMessageGroupingPeriod = (): number | undefined => useMessageRoomStore(s => s.Message_GroupingPeriod);

export const useAutoTranslate = (): { autoTranslateRoom?: boolean; autoTranslateLanguage?: string } =>
	useMessageRoomStore(
		useShallow(s => ({ autoTranslateRoom: s.autoTranslateRoom, autoTranslateLanguage: s.autoTranslateLanguage }))
	);
