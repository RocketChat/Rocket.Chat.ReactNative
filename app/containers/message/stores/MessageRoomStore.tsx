import { createContext, useContext, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { type IAttachment, type IUseRoomMessageHandlersResult, type IUser, type TAnyMessageModel } from '../../../definitions';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useSetting } from '../../../lib/hooks/useSetting';
import { getUserSelector } from '../../../selectors/login';

export type MessageRoomState = {
	// stable handlers
	jumpToMessage?: (link: string) => void;
	closeEmojiAndAction?: (action?: (params?: unknown) => void, params?: unknown) => void;
	// row action handlers
	reactionInit?: (messageId: string) => void;
	errorActionsShow?: (item: TAnyMessageModel) => void;
	// message handler bag produced by RoomView's RoomMessageHandlersBridge; a single stable identity
	// published in the reactive tail (leaves read it through the fine-grained selectors below)
	handlers?: Partial<IUseRoomMessageHandlersResult>;
	// overrides for views (e.g. MessagesView, SearchMessagesView) that render message leaves
	// outside a RoomStoreContext and so publish only this strict subset directly
	navToRoomInfo?: (navParam: any) => void;
	showAttachment?: (attachment: IAttachment) => void;
	archived?: boolean;
	isReadReceiptEnabled?: boolean;
	// room constants
	rid?: string;
	broadcast?: boolean;
	isThreadRoom?: boolean;
	tmid?: string;
	Message_GroupingPeriod?: number;
	timeFormat?: string;
	// reactive tail (provider keeps current)
	autoTranslateRoom?: boolean;
	autoTranslateLanguage?: string;
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

// Handlers and room constants captured once at mount by MessageRoomStoreProvider below (everything
// outside the reactive-tail resync effect). Callers MUST pass referentially stable values for these.
const FROZEN_KEYS = [
	'jumpToMessage',
	'closeEmojiAndAction',
	'reactionInit',
	'errorActionsShow',
	'navToRoomInfo',
	'showAttachment',
	'rid',
	'isThreadRoom',
	'tmid'
] as const satisfies readonly (keyof MessageRoomState)[];

const useFrozenHandlersGuardProd = (_state: MessageRoomState): void => {};

// Warns once (after mount) if a frozen handler/constant's identity changes, since the provider
// only captures the initial value and never re-syncs it (see FROZEN_KEYS above).
const useFrozenHandlersGuardDev = (state: MessageRoomState): void => {
	const initialRef = useRef(state);
	const warnedRef = useRef(false);
	useEffect(() => {
		if (warnedRef.current) return;
		const changed = FROZEN_KEYS.filter(key => !Object.is(initialRef.current[key], state[key]));
		if (changed.length > 0) {
			warnedRef.current = true;
			console.warn(
				`[MessageRoomStore] handler/constant identity changed after mount for: ${changed.join(', ')}. ` +
					'MessageRoomProvider captures these once; pass referentially stable values.'
			);
		}
	});
};

const useFrozenHandlersGuard: (state: MessageRoomState) => void = __DEV__
	? useFrozenHandlersGuardDev
	: useFrozenHandlersGuardProd;

const MessageRoomStoreProvider = ({ children, ...state }: { children: ReactNode } & MessageRoomState): ReactElement => {
	'use memo';

	const [store] = useState(() => createMessageRoomStore(state));
	useFrozenHandlersGuard(state);

	// These fields can change mid-session (e.g. an open room gets archived), unlike the
	// constants/handlers captured once above. The dep array keeps store writes on-change only.
	useEffect(() => {
		store.setState({
			timeFormat: state.timeFormat,
			autoTranslateRoom: state.autoTranslateRoom,
			autoTranslateLanguage: state.autoTranslateLanguage,
			archived: state.archived,
			broadcast: state.broadcast,
			isReadReceiptEnabled: state.isReadReceiptEnabled,
			Message_GroupingPeriod: state.Message_GroupingPeriod
		});
	}, [
		state.timeFormat,
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

const MessageRoomProviderWithSetting = ({ children, ...state }: { children: ReactNode } & MessageRoomState): ReactElement => {
	'use memo';

	const Message_TimeFormat = useSetting('Message_TimeFormat') as string;

	return (
		<MessageRoomStoreProvider {...state} timeFormat={Message_TimeFormat}>
			{children}
		</MessageRoomStoreProvider>
	);
};

export const MessageRoomProvider = ({ children, ...state }: { children: ReactNode } & MessageRoomState): ReactElement => {
	'use memo';

	return state.timeFormat != null ? (
		<MessageRoomStoreProvider {...state}>{children}</MessageRoomStoreProvider>
	) : (
		<MessageRoomProviderWithSetting {...state}>{children}</MessageRoomProviderWithSetting>
	);
};

export const useJumpToMessage = (): ((link: string) => void) | undefined => useMessageRoomStore(s => s.jumpToMessage);
export const useCloseEmojiAndAction = (): MessageRoomState['closeEmojiAndAction'] =>
	useMessageRoomStore(s => s.closeEmojiAndAction);

export const useReactionInit = (): MessageRoomState['reactionInit'] => useMessageRoomStore(s => s.reactionInit);
export const useErrorActionsShow = (): MessageRoomState['errorActionsShow'] => useMessageRoomStore(s => s.errorActionsShow);
// Leaves read handlers through these fine-grained selectors, optional-chaining a possibly-partial bag.
// navToRoomInfo/showAttachment prefer the view-level override (MessagesView, SearchMessagesView),
// falling back to the RoomView-produced bag.
export const useNavToRoomInfo = (): IUseRoomMessageHandlersResult['navToRoomInfo'] | undefined =>
	useMessageRoomStore(s => s.navToRoomInfo ?? s.handlers?.navToRoomInfo);
export const useShowAttachment = (): IUseRoomMessageHandlersResult['showAttachment'] | undefined =>
	useMessageRoomStore(s => s.showAttachment ?? s.handlers?.showAttachment);
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
export const useRoomTmid = (): string | undefined => useMessageRoomStore(s => s.tmid);
export const useMessageGroupingPeriod = (): number | undefined => useMessageRoomStore(s => s.Message_GroupingPeriod);

export const useAutoTranslate = (): { autoTranslateRoom?: boolean; autoTranslateLanguage?: string } =>
	useMessageRoomStore(
		useShallow(s => ({ autoTranslateRoom: s.autoTranslateRoom, autoTranslateLanguage: s.autoTranslateLanguage }))
	);
