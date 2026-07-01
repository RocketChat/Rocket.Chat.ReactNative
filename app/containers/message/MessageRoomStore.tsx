import { createContext, useContext, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { type TGetCustomEmoji } from '../../definitions/IEmoji';
import { type IAttachment } from '../../definitions';
import { type IRoomInfoParam } from '../../views/SearchMessagesView';
import { type TSupportedThemes } from '../../theme';

type MessageRoomState = {
	// stable handlers
	getCustomEmoji?: TGetCustomEmoji;
	navToRoomInfo?: (navParam: IRoomInfoParam) => void;
	showAttachment?: (file: IAttachment) => void;
	blockAction?: (params: { actionId: string; appId: string; value: string; blockId: string; rid: string; mid: string }) => void;
	handleEnterCall?: () => void;
	fetchThreadName?: (tmid: string, id: string) => Promise<string | undefined>;
	toggleFollowThread?: (isFollowingThread: boolean, tmid?: string) => Promise<void>;
	jumpToMessage?: (link: string) => void;
	// room constants
	rid?: string;
	user?: { id?: string; username?: string; token?: string };
	baseUrl?: string;
	broadcast?: boolean;
	isThreadRoom?: boolean;
	Message_GroupingPeriod?: number;
	// reactive tail (provider keeps current)
	autoTranslateRoom?: boolean;
	autoTranslateLanguage?: string;
	theme?: TSupportedThemes;
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

export const useRid = (): string | undefined => useMessageRoomStore(s => s.rid);
export const useMessageUser = (): MessageRoomState['user'] => useMessageRoomStore(s => s.user);
export const useBaseUrl = (): string | undefined => useMessageRoomStore(s => s.baseUrl);
export const useBroadcast = (): boolean | undefined => useMessageRoomStore(s => s.broadcast);
export const useIsThreadRoom = (): boolean | undefined => useMessageRoomStore(s => s.isThreadRoom);
export const useMessageGroupingPeriod = (): number | undefined => useMessageRoomStore(s => s.Message_GroupingPeriod);

export const useMessageTheme = (): TSupportedThemes | undefined => useMessageRoomStore(s => s.theme);

export const useAutoTranslate = (): { autoTranslateRoom?: boolean; autoTranslateLanguage?: string } =>
	useMessageRoomStore(
		useShallow(s => ({ autoTranslateRoom: s.autoTranslateRoom, autoTranslateLanguage: s.autoTranslateLanguage }))
	);
