import React, { createContext, ReactElement, useContext, useMemo, useReducer } from 'react';

import { IEmoji } from '../../definitions';
import { TMicOrSend } from './interfaces';

type TMessageComposerContextState = {
	showEmojiKeyboard: boolean;
	showEmojiSearchbar: boolean;
	focused: boolean;
	trackingViewHeight: number;
	keyboardHeight: number;
	micOrSend: TMicOrSend;
	showMarkdownToolbar: boolean;
};

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
};

const MessageComposerContextState = createContext<TMessageComposerContextState>({} as TMessageComposerContextState);
const MessageComposerContextApi = createContext<TMessageComposerContextApi>({} as TMessageComposerContextApi);

export const useMessageComposerState = (): TMessageComposerContextState => useContext(MessageComposerContextState);
export const useMessageComposerApi = (): TMessageComposerContextApi => useContext(MessageComposerContextApi);

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
	| { type: 'setMarkdownToolbar'; showMarkdownToolbar: boolean };

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
	}
};

export const MessageComposerProvider = ({ children }: { children: ReactElement }): ReactElement => {
	const [state, dispatch] = useReducer(reducer, {} as State);
	console.log('🚀 ~ file: context.tsx:101 ~ MessageComposerProvider ~ state:', state);

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

		return {
			setFocused,
			setKeyboardHeight,
			setTrackingViewHeight,
			openEmojiKeyboard,
			closeEmojiKeyboard,
			openSearchEmojiKeyboard,
			closeSearchEmojiKeyboard,
			setMicOrSend,
			setMarkdownToolbar
		};
	}, []);

	return (
		<MessageComposerContextApi.Provider value={api}>
			<MessageComposerContextState.Provider value={state}>{children}</MessageComposerContextState.Provider>
		</MessageComposerContextApi.Provider>
	);
};
