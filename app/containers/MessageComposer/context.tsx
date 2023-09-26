import React, { createContext, ReactElement, useContext, useMemo, useReducer } from 'react';

import { IEmoji } from '../../definitions';
import { TMicOrSend } from './interfaces';

type TMessageComposerContextApi = {
	setKeyboardHeight: (height: number) => void;
	setTrackingViewHeight: (height: number) => void;
	openEmojiKeyboard(): void;
	closeEmojiKeyboard(): void;
	openSearchEmojiKeyboard(): void;
	closeSearchEmojiKeyboard(): void;
	setFocused(focused: boolean): void;
	setMicOrSend(micOrSend: TMicOrSend): void;
	setMarkdownToolbar(showMarkdownToolbar: boolean): void;
	setAlsoSendThreadToChannel(alsoSendThreadToChannel: boolean): void;
};

const FocusedContext = createContext<State['focused']>({} as State['focused']);
const MicOrSendContext = createContext<State['micOrSend']>({} as State['micOrSend']);
const ShowMarkdownToolbarContext = createContext<State['showMarkdownToolbar']>({} as State['showMarkdownToolbar']);
const ShowEmojiKeyboardContext = createContext<State['showEmojiKeyboard']>({} as State['showEmojiKeyboard']);
const ShowEmojiSearchbarContext = createContext<State['showEmojiSearchbar']>({} as State['showEmojiSearchbar']);
const KeyboardHeightContext = createContext<State['keyboardHeight']>({} as State['keyboardHeight']);
const TrackingViewHeightContext = createContext<State['trackingViewHeight']>({} as State['trackingViewHeight']);
const AlsoSendThreadToChannelContext = createContext<State['alsoSendThreadToChannel']>({} as State['alsoSendThreadToChannel']);
const MessageComposerContextApi = createContext<TMessageComposerContextApi>({} as TMessageComposerContextApi);

export const useMessageComposerApi = (): TMessageComposerContextApi => useContext(MessageComposerContextApi);
export const useFocused = (): State['focused'] => useContext(FocusedContext);
export const useMicOrSend = (): State['micOrSend'] => useContext(MicOrSendContext);
export const useShowMarkdownToolbar = (): State['showMarkdownToolbar'] => useContext(ShowMarkdownToolbarContext);
export const useShowEmojiKeyboard = (): State['showEmojiKeyboard'] => useContext(ShowEmojiKeyboardContext);
export const useShowEmojiSearchbar = (): State['showEmojiSearchbar'] => useContext(ShowEmojiSearchbarContext);
export const useKeyboardHeight = (): State['keyboardHeight'] => useContext(KeyboardHeightContext);
export const useTrackingViewHeight = (): State['trackingViewHeight'] => useContext(TrackingViewHeightContext);
export const useAlsoSendThreadToChannel = (): State['alsoSendThreadToChannel'] => useContext(AlsoSendThreadToChannelContext);

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
	showEmojiKeyboard: boolean;
	showEmojiSearchbar: boolean;
	focused: boolean;
	trackingViewHeight: number;
	keyboardHeight: number;
	micOrSend: TMicOrSend;
	showMarkdownToolbar: boolean;
	alsoSendThreadToChannel: boolean;
};

type Actions =
	| { type: 'updateEmojiKeyboard'; showEmojiKeyboard: boolean }
	| { type: 'updateEmojiSearchbar'; showEmojiSearchbar: boolean }
	| { type: 'updateFocused'; focused: boolean }
	| { type: 'updateTrackingViewHeight'; trackingViewHeight: number }
	| { type: 'updateKeyboardHeight'; keyboardHeight: number }
	| { type: 'openEmojiKeyboard' }
	| { type: 'closeEmojiKeyboard' }
	| { type: 'openSearchEmojiKeyboard' }
	| { type: 'closeSearchEmojiKeyboard' }
	| { type: 'setMicOrSend'; micOrSend: TMicOrSend }
	| { type: 'setMarkdownToolbar'; showMarkdownToolbar: boolean }
	| { type: 'setAlsoSendThreadToChannel'; alsoSendThreadToChannel: boolean };

const reducer = (state: State, action: Actions): State => {
	switch (action.type) {
		case 'updateEmojiKeyboard':
			return { ...state, showEmojiKeyboard: action.showEmojiKeyboard };
		case 'updateEmojiSearchbar':
			return { ...state, showEmojiSearchbar: action.showEmojiSearchbar };
		case 'updateFocused':
			return { ...state, focused: action.focused };
		case 'updateTrackingViewHeight':
			return { ...state, trackingViewHeight: action.trackingViewHeight };
		case 'updateKeyboardHeight':
			return { ...state, keyboardHeight: action.keyboardHeight };
		case 'openEmojiKeyboard':
			return { ...state, showEmojiKeyboard: true, showEmojiSearchbar: false };
		case 'openSearchEmojiKeyboard':
			return { ...state, showEmojiKeyboard: false, showEmojiSearchbar: true };
		case 'closeEmojiKeyboard':
			return { ...state, showEmojiKeyboard: false, showEmojiSearchbar: false };
		case 'closeSearchEmojiKeyboard':
			return { ...state, showEmojiSearchbar: false };
		case 'setMicOrSend':
			return { ...state, micOrSend: action.micOrSend };
		case 'setMarkdownToolbar':
			return { ...state, showMarkdownToolbar: action.showMarkdownToolbar };
		case 'setAlsoSendThreadToChannel':
			return { ...state, alsoSendThreadToChannel: action.alsoSendThreadToChannel };
	}
};

export const MessageComposerProvider = ({ children }: { children: ReactElement }): ReactElement => {
	const [state, dispatch] = useReducer(reducer, {} as State);

	const api = useMemo(() => {
		const setFocused = (focused: boolean) => dispatch({ type: 'updateFocused', focused });

		const setKeyboardHeight = (keyboardHeight: number) => dispatch({ type: 'updateKeyboardHeight', keyboardHeight });

		const setTrackingViewHeight = (trackingViewHeight: number) =>
			dispatch({ type: 'updateTrackingViewHeight', trackingViewHeight });

		const openEmojiKeyboard = () => dispatch({ type: 'openEmojiKeyboard' });

		const closeEmojiKeyboard = () => dispatch({ type: 'closeEmojiKeyboard' });

		const openSearchEmojiKeyboard = () => dispatch({ type: 'openSearchEmojiKeyboard' });

		const closeSearchEmojiKeyboard = () => dispatch({ type: 'closeSearchEmojiKeyboard' });

		const setMicOrSend = (micOrSend: TMicOrSend) => dispatch({ type: 'setMicOrSend', micOrSend });

		const setMarkdownToolbar = (showMarkdownToolbar: boolean) => dispatch({ type: 'setMarkdownToolbar', showMarkdownToolbar });

		const setAlsoSendThreadToChannel = (alsoSendThreadToChannel: boolean) =>
			dispatch({ type: 'setAlsoSendThreadToChannel', alsoSendThreadToChannel });

		return {
			setFocused,
			setKeyboardHeight,
			setTrackingViewHeight,
			openEmojiKeyboard,
			closeEmojiKeyboard,
			openSearchEmojiKeyboard,
			closeSearchEmojiKeyboard,
			setMicOrSend,
			setMarkdownToolbar,
			setAlsoSendThreadToChannel
		};
	}, []);

	return (
		<MessageComposerContextApi.Provider value={api}>
			<ShowEmojiKeyboardContext.Provider value={state.showEmojiKeyboard}>
				<ShowEmojiSearchbarContext.Provider value={state.showEmojiSearchbar}>
					<FocusedContext.Provider value={state.focused}>
						<KeyboardHeightContext.Provider value={state.keyboardHeight}>
							<TrackingViewHeightContext.Provider value={state.trackingViewHeight}>
								<ShowMarkdownToolbarContext.Provider value={state.showMarkdownToolbar}>
									<AlsoSendThreadToChannelContext.Provider value={state.alsoSendThreadToChannel}>
										<MicOrSendContext.Provider value={state.micOrSend}>{children}</MicOrSendContext.Provider>
									</AlsoSendThreadToChannelContext.Provider>
								</ShowMarkdownToolbarContext.Provider>
							</TrackingViewHeightContext.Provider>
						</KeyboardHeightContext.Provider>
					</FocusedContext.Provider>
				</ShowEmojiSearchbarContext.Provider>
			</ShowEmojiKeyboardContext.Provider>
		</MessageComposerContextApi.Provider>
	);
};
