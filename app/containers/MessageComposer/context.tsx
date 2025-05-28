import React, { createContext, ReactElement, useContext, useMemo, useReducer } from 'react';

import { IEmoji } from '../../definitions';
import { IAutocompleteBase, TMicOrSend } from './interfaces';
import { animateNextTransition } from '../../lib/methods/helpers';

type TMessageComposerContextApi = {
	setFocused(focused: boolean): void;
	setMicOrSend(micOrSend: TMicOrSend): void;
	setMarkdownToolbar(showMarkdownToolbar: boolean): void;
	setAlsoSendThreadToChannel(alsoSendThreadToChannel: boolean): void;
	setRecordingAudio(recordingAudio: boolean): void;
	setAutocompleteParams(params: IAutocompleteBase): void;
};

const FocusedContext = createContext<State['focused']>({} as State['focused']);
const MicOrSendContext = createContext<State['micOrSend']>({} as State['micOrSend']);
const ShowMarkdownToolbarContext = createContext<State['showMarkdownToolbar']>({} as State['showMarkdownToolbar']);
const AlsoSendThreadToChannelContext = createContext<State['alsoSendThreadToChannel']>({} as State['alsoSendThreadToChannel']);
const RecordingAudioContext = createContext<State['recordingAudio']>({} as State['recordingAudio']);
const AutocompleteParamsContext = createContext<State['autocompleteParams']>({} as State['autocompleteParams']);
const MessageComposerContextApi = createContext<TMessageComposerContextApi>({} as TMessageComposerContextApi);

export const useMessageComposerApi = (): TMessageComposerContextApi => useContext(MessageComposerContextApi);
export const useFocused = (): State['focused'] => useContext(FocusedContext);
export const useMicOrSend = (): State['micOrSend'] => useContext(MicOrSendContext);
export const useShowMarkdownToolbar = (): State['showMarkdownToolbar'] => useContext(ShowMarkdownToolbarContext);
export const useAlsoSendThreadToChannel = (): State['alsoSendThreadToChannel'] => useContext(AlsoSendThreadToChannelContext);
export const useRecordingAudio = (): State['recordingAudio'] => useContext(RecordingAudioContext);
export const useAutocompleteParams = (): State['autocompleteParams'] => useContext(AutocompleteParamsContext);

// TODO: rename
type TMessageInnerContext = {
	sendMessage(): void;
	onEmojiSelected(emoji: IEmoji): void;
	// TODO: action should be required
	closeEmojiKeyboardAndAction(action?: Function, params?: any): void;
};

// TODO: rename
export const MessageInnerContext = createContext<TMessageInnerContext>({
	sendMessage: () => {},
	onEmojiSelected: () => {},
	closeEmojiKeyboardAndAction: () => {}
});

type State = {
	focused: boolean;
	micOrSend: TMicOrSend;
	showMarkdownToolbar: boolean;
	alsoSendThreadToChannel: boolean;
	recordingAudio: boolean;
	autocompleteParams: IAutocompleteBase;
};

type Actions =
	| { type: 'updateFocused'; focused: boolean }
	| { type: 'setMicOrSend'; micOrSend: TMicOrSend }
	| { type: 'setMarkdownToolbar'; showMarkdownToolbar: boolean }
	| { type: 'setAlsoSendThreadToChannel'; alsoSendThreadToChannel: boolean }
	| { type: 'setRecordingAudio'; recordingAudio: boolean }
	| { type: 'setAutocompleteParams'; params: IAutocompleteBase };

const reducer = (state: State, action: Actions): State => {
	switch (action.type) {
		case 'updateFocused':
			animateNextTransition();
			return { ...state, focused: action.focused };
		case 'setMicOrSend':
			return { ...state, micOrSend: action.micOrSend };
		case 'setMarkdownToolbar':
			animateNextTransition();
			return { ...state, showMarkdownToolbar: action.showMarkdownToolbar };
		case 'setAlsoSendThreadToChannel':
			return { ...state, alsoSendThreadToChannel: action.alsoSendThreadToChannel };
		case 'setRecordingAudio':
			animateNextTransition();
			return { ...state, recordingAudio: action.recordingAudio };
		case 'setAutocompleteParams':
			return { ...state, autocompleteParams: action.params };
	}
};

export const MessageComposerProvider = ({ children }: { children: ReactElement }): ReactElement => {
	const [state, dispatch] = useReducer(reducer, {
		autocompleteParams: { text: '', type: null }
	} as State);

	const api = useMemo(() => {
		const setFocused = (focused: boolean) => dispatch({ type: 'updateFocused', focused });

		const setMicOrSend = (micOrSend: TMicOrSend) => dispatch({ type: 'setMicOrSend', micOrSend });

		const setMarkdownToolbar = (showMarkdownToolbar: boolean) => dispatch({ type: 'setMarkdownToolbar', showMarkdownToolbar });

		const setAlsoSendThreadToChannel = (alsoSendThreadToChannel: boolean) =>
			dispatch({ type: 'setAlsoSendThreadToChannel', alsoSendThreadToChannel });

		const setRecordingAudio = (recordingAudio: boolean) => dispatch({ type: 'setRecordingAudio', recordingAudio });

		const setAutocompleteParams = (params: IAutocompleteBase) => dispatch({ type: 'setAutocompleteParams', params });

		return {
			setFocused,
			setMicOrSend,
			setMarkdownToolbar,
			setAlsoSendThreadToChannel,
			setRecordingAudio,
			setAutocompleteParams
		};
	}, []);

	return (
		<MessageComposerContextApi.Provider value={api}>
			<FocusedContext.Provider value={state.focused}>
				<ShowMarkdownToolbarContext.Provider value={state.showMarkdownToolbar}>
					<AlsoSendThreadToChannelContext.Provider value={state.alsoSendThreadToChannel}>
						<RecordingAudioContext.Provider value={state.recordingAudio}>
							<AutocompleteParamsContext.Provider value={state.autocompleteParams}>
								<MicOrSendContext.Provider value={state.micOrSend}>{children}</MicOrSendContext.Provider>
							</AutocompleteParamsContext.Provider>
						</RecordingAudioContext.Provider>
					</AlsoSendThreadToChannelContext.Provider>
				</ShowMarkdownToolbarContext.Provider>
			</FocusedContext.Provider>
		</MessageComposerContextApi.Provider>
	);
};
