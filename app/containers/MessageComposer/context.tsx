import React, { createContext, type ReactElement, useContext, useMemo, useReducer } from 'react';

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

const FocusedContext = createContext<State['focused']>({} as State['focused']);
const MicOrSendContext = createContext<State['micOrSend']>({} as State['micOrSend']);
const ShowMarkdownToolbarContext = createContext<State['showMarkdownToolbar']>({} as State['showMarkdownToolbar']);
const AlsoSendThreadToChannelContext = createContext<State['alsoSendThreadToChannel']>({} as State['alsoSendThreadToChannel']);
const RecordingAudioContext = createContext<State['recordingAudio']>({} as State['recordingAudio']);
const AutocompleteParamsContext = createContext<State['autocompleteParams']>({} as State['autocompleteParams']);
const ComposerAttachmentsContext = createContext<State['attachments']>([] as State['attachments']);
const MessageComposerContextApi = createContext<TMessageComposerContextApi>({} as TMessageComposerContextApi);

export const useMessageComposerApi = (): TMessageComposerContextApi => useContext(MessageComposerContextApi);
export const useFocused = (): State['focused'] => useContext(FocusedContext);
export const useMicOrSend = (): State['micOrSend'] => useContext(MicOrSendContext);
export const useShowMarkdownToolbar = (): State['showMarkdownToolbar'] => useContext(ShowMarkdownToolbarContext);
export const useAlsoSendThreadToChannel = (): State['alsoSendThreadToChannel'] => useContext(AlsoSendThreadToChannelContext);
export const useRecordingAudio = (): State['recordingAudio'] => useContext(RecordingAudioContext);
export const useAutocompleteParams = (): State['autocompleteParams'] => useContext(AutocompleteParamsContext);
export const useComposerAttachments = (): State['attachments'] => useContext(ComposerAttachmentsContext);

// TODO: rename
type TMessageInnerContext = {
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

type State = {
	focused: boolean;
	micOrSend: TMicOrSend;
	showMarkdownToolbar: boolean;
	alsoSendThreadToChannel: boolean;
	recordingAudio: boolean;
	autocompleteParams: IAutocompleteBase;
	attachments: IShareAttachment[];
};

type Actions =
	| { type: 'updateFocused'; focused: boolean }
	| { type: 'setMicOrSend'; micOrSend: TMicOrSend }
	| { type: 'setMarkdownToolbar'; showMarkdownToolbar: boolean }
	| { type: 'setAlsoSendThreadToChannel'; alsoSendThreadToChannel: boolean }
	| { type: 'setRecordingAudio'; recordingAudio: boolean }
	| { type: 'setAutocompleteParams'; params: IAutocompleteBase }
	| { type: 'addAttachments'; attachments: IShareAttachment[] }
	| { type: 'updateAttachment'; path: string; attachment: Partial<IShareAttachment> }
	| { type: 'removeAttachment'; path: string }
	| { type: 'clearAttachments' };

const reducer = (state: State, action: Actions): State => {
	switch (action.type) {
		case 'updateFocused':
			return { ...state, focused: action.focused };
		case 'setMicOrSend':
			return { ...state, micOrSend: action.micOrSend };
		case 'setMarkdownToolbar':
			return { ...state, showMarkdownToolbar: action.showMarkdownToolbar };
		case 'setAlsoSendThreadToChannel':
			return { ...state, alsoSendThreadToChannel: action.alsoSendThreadToChannel };
		case 'setRecordingAudio':
			return { ...state, recordingAudio: action.recordingAudio };
		case 'setAutocompleteParams':
			return { ...state, autocompleteParams: action.params };
		case 'addAttachments':
			return { ...state, attachments: [...state.attachments, ...action.attachments] };
		case 'updateAttachment':
			return {
				...state,
				attachments: state.attachments.map(currentAttachment =>
					currentAttachment.path === action.path ? { ...currentAttachment, ...action.attachment } : currentAttachment
				)
			};
		case 'removeAttachment':
			return { ...state, attachments: state.attachments.filter(attachment => attachment.path !== action.path) };
		case 'clearAttachments':
			return { ...state, attachments: [] };
	}
};

export const MessageComposerProvider = ({ children }: { children: ReactElement }): ReactElement => {
	'use memo';

	const [state, dispatch] = useReducer(reducer, {
		autocompleteParams: { text: '', type: null },
		attachments: []
	} as State);

	const api = useMemo(() => {
		const setFocused = (focused: boolean) => dispatch({ type: 'updateFocused', focused });

		const setMicOrSend = (micOrSend: TMicOrSend) => dispatch({ type: 'setMicOrSend', micOrSend });

		const setMarkdownToolbar = (showMarkdownToolbar: boolean) => dispatch({ type: 'setMarkdownToolbar', showMarkdownToolbar });

		const setAlsoSendThreadToChannel = (alsoSendThreadToChannel: boolean) =>
			dispatch({ type: 'setAlsoSendThreadToChannel', alsoSendThreadToChannel });

		const setRecordingAudio = (recordingAudio: boolean) => dispatch({ type: 'setRecordingAudio', recordingAudio });

		const setAutocompleteParams = (params: IAutocompleteBase) => dispatch({ type: 'setAutocompleteParams', params });

		const addAttachments = (attachments: IShareAttachment[]) => dispatch({ type: 'addAttachments', attachments });

		const updateAttachment = (path: string, attachment: Partial<IShareAttachment>) =>
			dispatch({ type: 'updateAttachment', path, attachment });

		const removeAttachment = (path: string) => dispatch({ type: 'removeAttachment', path });

		const clearAttachments = () => dispatch({ type: 'clearAttachments' });

		return {
			setFocused,
			setMicOrSend,
			setMarkdownToolbar,
			setAlsoSendThreadToChannel,
			setRecordingAudio,
			setAutocompleteParams,
			addAttachments,
			updateAttachment,
			removeAttachment,
			clearAttachments
		};
	}, []);

	return (
		<MessageComposerContextApi.Provider value={api}>
			<FocusedContext.Provider value={state.focused}>
				<ShowMarkdownToolbarContext.Provider value={state.showMarkdownToolbar}>
					<AlsoSendThreadToChannelContext.Provider value={state.alsoSendThreadToChannel}>
						<RecordingAudioContext.Provider value={state.recordingAudio}>
							<AutocompleteParamsContext.Provider value={state.autocompleteParams}>
								<ComposerAttachmentsContext.Provider value={state.attachments}>
									<MicOrSendContext.Provider value={state.micOrSend}>{children}</MicOrSendContext.Provider>
								</ComposerAttachmentsContext.Provider>
							</AutocompleteParamsContext.Provider>
						</RecordingAudioContext.Provider>
					</AlsoSendThreadToChannelContext.Provider>
				</ShowMarkdownToolbarContext.Provider>
			</FocusedContext.Provider>
		</MessageComposerContextApi.Provider>
	);
};
