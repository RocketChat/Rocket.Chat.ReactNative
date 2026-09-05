import { createContext, type ReactElement, useContext, useState } from 'react';
import { createStore, useStore } from 'zustand';

import { type IEmoji, type IShareAttachment } from '../../definitions';
import { type IAutocompleteBase, type TMicOrSend } from './interfaces';

type TMessageComposerContextApi = {
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

type State = {
	focused: boolean;
	micOrSend: TMicOrSend;
	showMarkdownToolbar: boolean;
	alsoSendThreadToChannel: boolean;
	recordingAudio: boolean;
	autocompleteParams: IAutocompleteBase;
	attachments: IShareAttachment[];
	// Built once, never replaced by a setter — stays a stable ref for consumers.
	actions: TMessageComposerContextApi;
};

// One store per provider instance: channel + thread composers can be mounted at once, each needs isolated state.
const createComposerStore = () =>
	createStore<State>()(set => ({
		focused: false,
		micOrSend: 'mic',
		showMarkdownToolbar: false,
		alsoSendThreadToChannel: false,
		recordingAudio: false,
		autocompleteParams: { text: '', type: null },
		attachments: [],
		actions: {
			setFocused: focused => set({ focused }),
			setMicOrSend: micOrSend => set({ micOrSend }),
			setMarkdownToolbar: showMarkdownToolbar => set({ showMarkdownToolbar }),
			setAlsoSendThreadToChannel: alsoSendThreadToChannel => set({ alsoSendThreadToChannel }),
			setRecordingAudio: recordingAudio => set({ recordingAudio }),
			setAutocompleteParams: params => set({ autocompleteParams: params }),
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

type ComposerStore = ReturnType<typeof createComposerStore>;

const ComposerStoreContext = createContext<ComposerStore | null>(null);

const useComposerStore = <T,>(selector: (state: State) => T): T => {
	const store = useContext(ComposerStoreContext);
	if (!store) {
		throw new Error('MessageComposer hooks must be used within a MessageComposerProvider');
	}
	return useStore(store, selector);
};

export const useMessageComposerApi = (): TMessageComposerContextApi => useComposerStore(state => state.actions);
export const useFocused = (): State['focused'] => useComposerStore(state => state.focused);
export const useMicOrSend = (): State['micOrSend'] => useComposerStore(state => state.micOrSend);
export const useShowMarkdownToolbar = (): State['showMarkdownToolbar'] => useComposerStore(state => state.showMarkdownToolbar);
export const useAlsoSendThreadToChannel = (): State['alsoSendThreadToChannel'] =>
	useComposerStore(state => state.alsoSendThreadToChannel);
export const useRecordingAudio = (): State['recordingAudio'] => useComposerStore(state => state.recordingAudio);
export const useAutocompleteParams = (): State['autocompleteParams'] => useComposerStore(state => state.autocompleteParams);
export const useComposerAttachments = (): State['attachments'] => useComposerStore(state => state.attachments);

// TODO: rename
export type TMessageInnerContext = {
	sendMessage(): void;
	onEmojiSelected(emoji: IEmoji): void;
	// TODO: action should be required
	closeEmojiKeyboardAndAction(action?: Function, params?: any): void;
	focus(): void;
};

// TODO: rename
export const MessageInnerContext = createContext<TMessageInnerContext>({
	sendMessage: () => {},
	onEmojiSelected: () => {},
	closeEmojiKeyboardAndAction: () => {},
	focus: () => {}
});

export const MessageComposerProvider = ({ children }: { children: ReactElement }): ReactElement => {
	const [store] = useState(createComposerStore);

	return <ComposerStoreContext.Provider value={store}>{children}</ComposerStoreContext.Provider>;
};
