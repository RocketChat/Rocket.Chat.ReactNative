import { createContext, useContext, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { type IAttachment, type TAnyMessageModel } from '../../../definitions';
import { useSetting } from '../../../lib/hooks/useSetting';

export type MessageRoomState = {
	// stable handlers
	jumpToMessage?: (link: string) => void;
	closeEmojiAndAction?: (action?: (params?: unknown) => void, params?: unknown) => void;
	// row action handlers
	reactionInit?: (messageId: string) => void;
	errorActionsShow?: (item: TAnyMessageModel) => void;
	// overrides for views (e.g. MessagesView, SearchMessagesView) that render message leaves
	// outside a RoomStoreContext and so can't get these from useRoomMessageHandlers
	navToRoomInfo?: (navParam: any) => void;
	showAttachment?: (attachment: IAttachment) => void;
	archived?: boolean;
	isReadReceiptEnabled?: boolean;
	// room constants
	rid?: string;
	user?: { id?: string; username?: string; token?: string };
	baseUrl?: string;
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
	'user',
	'baseUrl',
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
// Only set by views (MessagesView, SearchMessagesView) that render message leaves outside a
// RoomStoreContext; leaves prefer this override, falling back to useRoomMessageHandlers.
export const useNavToRoomInfoOverride = (): MessageRoomState['navToRoomInfo'] => useMessageRoomStore(s => s.navToRoomInfo);
export const useShowAttachmentOverride = (): MessageRoomState['showAttachment'] => useMessageRoomStore(s => s.showAttachment);
export const useIsArchived = (): boolean | undefined => useMessageRoomStore(s => s.archived);
export const useIsReadReceiptEnabled = (): boolean | undefined => useMessageRoomStore(s => s.isReadReceiptEnabled);

export const useRid = (): string | undefined => useMessageRoomStore(s => s.rid);
export const useMessageUser = (): MessageRoomState['user'] => useMessageRoomStore(s => s.user);
export const useBaseUrl = (): string | undefined => useMessageRoomStore(s => s.baseUrl);
export const useBroadcast = (): boolean | undefined => useMessageRoomStore(s => s.broadcast);
export const useTimeFormat = (): string | undefined => useMessageRoomStore(s => s.timeFormat);
export const useIsThreadRoom = (): boolean | undefined => useMessageRoomStore(s => s.isThreadRoom);
export const useRoomTmid = (): string | undefined => useMessageRoomStore(s => s.tmid);
export const useMessageGroupingPeriod = (): number | undefined => useMessageRoomStore(s => s.Message_GroupingPeriod);

export const useAutoTranslate = (): { autoTranslateRoom?: boolean; autoTranslateLanguage?: string } =>
	useMessageRoomStore(
		useShallow(s => ({ autoTranslateRoom: s.autoTranslateRoom, autoTranslateLanguage: s.autoTranslateLanguage }))
	);
