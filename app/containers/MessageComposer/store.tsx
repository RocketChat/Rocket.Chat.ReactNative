import { createContext, type ReactElement, type ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { createStore, useStore } from 'zustand';

import { type IShareAttachment } from '../../definitions';
import { useRoomWithUpdate } from '../../lib/store/RoomStoreContext';
import {
	type IAutocompleteBase,
	type IMessageComposerContainerProps,
	type TEditRequest,
	type TMicOrSend,
	type TOnRemoveQuoteMessage,
	type TOnSendMessage
} from './interfaces';

type TMessageComposerApi = {
	setFocused(focused: boolean): void;
	setMicOrSend(micOrSend: TMicOrSend): void;
	setMarkdownToolbar(showMarkdownToolbar: boolean): void;
	setAlsoSendThreadToChannel(alsoSendThreadToChannel: boolean): void;
	setRecordingAudio(recordingAudio: boolean): void;
	setAutocompleteParams(params: IAutocompleteBase): void;
	addAttachments(attachments: IShareAttachment[]): void;
	updateAttachment(path: string, attachment: Partial<IShareAttachment>): void;
	removeAttachment(path: string): void;
	clearAttachments(): void;
};

type ComposerState = {
	tmid?: string;
	sharing: boolean;
	focused: boolean;
	micOrSend: TMicOrSend;
	showMarkdownToolbar: boolean;
	alsoSendThreadToChannel: boolean;
	recordingAudio: boolean;
	autocompleteParams: IAutocompleteBase;
	attachments: IShareAttachment[];
	isAutocompleteVisible: boolean;
	updateAutocompleteVisible(isVisible: boolean): void;
	actions: TMessageComposerApi;
};

type ComposerCallbacks = Pick<
	IMessageComposerContainerProps,
	'onSendMessage' | 'editRequest' | 'editCancel' | 'onRemoveQuoteMessage'
>;

export const createComposerStore = ({ tmid, sharing = false }: Pick<IMessageComposerContainerProps, 'tmid' | 'sharing'> = {}) =>
	createStore<ComposerState>()((set, get) => ({
		tmid,
		sharing,
		focused: false,
		micOrSend: 'mic',
		showMarkdownToolbar: false,
		alsoSendThreadToChannel: false,
		recordingAudio: false,
		autocompleteParams: { text: '', type: null },
		attachments: [],
		isAutocompleteVisible: false,
		updateAutocompleteVisible: isAutocompleteVisible => {
			if (isAutocompleteVisible !== get().isAutocompleteVisible) {
				set({ isAutocompleteVisible });
			}
		},
		actions: {
			setFocused: focused => set({ focused }),
			setMicOrSend: micOrSend => set({ micOrSend }),
			setMarkdownToolbar: showMarkdownToolbar => set({ showMarkdownToolbar }),
			setAlsoSendThreadToChannel: alsoSendThreadToChannel => set({ alsoSendThreadToChannel }),
			setRecordingAudio: recordingAudio => set({ recordingAudio }),
			setAutocompleteParams: autocompleteParams => set({ autocompleteParams }),
			addAttachments: attachments => set(state => ({ attachments: [...state.attachments, ...attachments] })),
			updateAttachment: (path, attachment) =>
				set(state => ({
					attachments: state.attachments.map(currentAttachment =>
						currentAttachment.path === path ? { ...currentAttachment, ...attachment } : currentAttachment
					)
				})),
			removeAttachment: path => set(state => ({ attachments: state.attachments.filter(attachment => attachment.path !== path) })),
			clearAttachments: () => set({ attachments: [] })
		}
	}));

export type ComposerStore = ReturnType<typeof createComposerStore>;

export const ComposerStoreContext = createContext<ComposerStore | null>(null);
const ComposerCallbacksContext = createContext<React.MutableRefObject<ComposerCallbacks> | null>(null);

export const useComposerStoreApi = (): ComposerStore => {
	const store = useContext(ComposerStoreContext);
	if (!store) {
		throw new Error('MessageComposer hooks must be used within a MessageComposerContainer');
	}
	return store;
};

const useComposerStore = <T,>(selector: (state: ComposerState) => T): T => useStore(useComposerStoreApi(), selector);

const useComposerCallbacks = () => {
	const callbacks = useContext(ComposerCallbacksContext);
	if (!callbacks) {
		throw new Error('MessageComposer hooks must be used within a MessageComposerContainer');
	}
	return callbacks;
};

export const ComposerStoreProvider = ({
	children,
	tmid,
	sharing = false,
	...callbacks
}: ComposerCallbacks & Pick<IMessageComposerContainerProps, 'tmid' | 'sharing'> & { children: ReactNode }): ReactElement => {
	const [store] = useState(() => createComposerStore({ tmid, sharing }));
	const callbacksRef = useRef(callbacks);
	callbacksRef.current = callbacks;

	return (
		<ComposerStoreContext.Provider value={store}>
			<ComposerCallbacksContext.Provider value={callbacksRef}>{children}</ComposerCallbacksContext.Provider>
		</ComposerStoreContext.Provider>
	);
};

export const useMessageComposerApi = (): TMessageComposerApi => useComposerStore(state => state.actions);
export const useFocused = (): ComposerState['focused'] => useComposerStore(state => state.focused);
export const useMicOrSend = (): ComposerState['micOrSend'] => useComposerStore(state => state.micOrSend);
export const useShowMarkdownToolbar = (): ComposerState['showMarkdownToolbar'] =>
	useComposerStore(state => state.showMarkdownToolbar);
export const useAlsoSendThreadToChannel = (): ComposerState['alsoSendThreadToChannel'] =>
	useComposerStore(state => state.alsoSendThreadToChannel);
export const useRecordingAudio = (): ComposerState['recordingAudio'] => useComposerStore(state => state.recordingAudio);
export const useAutocompleteParams = (): ComposerState['autocompleteParams'] =>
	useComposerStore(state => state.autocompleteParams);
export const useComposerAttachments = (): ComposerState['attachments'] => useComposerStore(state => state.attachments);
export const useComposerTmid = (): ComposerState['tmid'] => useComposerStore(state => state.tmid);
export const useComposerSharing = (): ComposerState['sharing'] => useComposerStore(state => state.sharing);
export const useIsAutocompleteVisible = (): ComposerState['isAutocompleteVisible'] =>
	useComposerStore(state => state.isAutocompleteVisible);
export const useUpdateAutocompleteVisible = (): ComposerState['updateAutocompleteVisible'] =>
	useComposerStore(state => state.updateAutocompleteVisible);
export const useComposerRoom = () => useRoomWithUpdate();
export const useComposerRid = () => useComposerRoom().rid;
export const useComposerType = () => useComposerRoom().t;

export const useEditCancel = (): (() => void) => {
	const callbacks = useComposerCallbacks();
	return useCallback(() => callbacks.current.editCancel?.(), [callbacks]);
};

export const useEditRequest = (): TEditRequest => {
	const callbacks = useComposerCallbacks();
	return useCallback(message => callbacks.current.editRequest?.(message) ?? Promise.resolve(), [callbacks]);
};

export const useOnRemoveQuoteMessage = (): TOnRemoveQuoteMessage => {
	const callbacks = useComposerCallbacks();
	return useCallback(messageId => callbacks.current.onRemoveQuoteMessage?.(messageId), [callbacks]);
};

export const useOnSendMessage = (): TOnSendMessage => {
	const callbacks = useComposerCallbacks();
	return useCallback((message, tshow) => callbacks.current.onSendMessage?.(message, tshow), [callbacks]);
};
