import { createContext, ReactElement, useImperativeHandle, useReducer } from 'react';
import { useBackHandler } from '@react-native-community/hooks';

import { TIMEOUT_CLOSE_EMOJI_KEYBOARD } from './constants';
import { isIOS } from '../../lib/methods/helpers';
import { IEmoji, IMessage, TAnyMessageModel } from '../../definitions';

type TMessageComposerContextProps = {
	rid: string;
	tmid?: string;
	editing: boolean;
	// TODO: Refactor to "origin"? ShareView | RoomView?
	sharing: boolean;
	message?: IMessage;
	editRequest?: (message: TAnyMessageModel) => Promise<void>;
	editCancel?: () => void;
	onSendMessage: (message: string, tmid?: string) => void;
};

export const MessageComposerContextProps = createContext<TMessageComposerContextProps>({
	rid: '',
	editing: false,
	sharing: false,
	message: undefined,
	editRequest: () => Promise.resolve(),
	editCancel: () => {},
	onSendMessage: () => {}
});

type TMessageComposerContext = {
	showEmojiKeyboard: boolean;
	showEmojiSearchbar: boolean;
	focused: boolean;
	trackingViewHeight: number;
	keyboardHeight: number;
	setKeyboardHeight: (height: number) => void;
	setTrackingViewHeight: (height: number) => void;
	openEmojiKeyboard(): void;
	closeEmojiKeyboard(): void;
	openSearchEmojiKeyboard(): void;
	setFocused(focused: boolean): void;
	closeEmojiKeyboardAndAction(action?: Function, params?: any): void;
};

export const MessageComposerContext = createContext<TMessageComposerContext>({
	showEmojiKeyboard: false,
	showEmojiSearchbar: false,
	focused: false,
	trackingViewHeight: 0,
	keyboardHeight: 0,
	setKeyboardHeight: () => {},
	setTrackingViewHeight: () => {},
	openEmojiKeyboard: () => {},
	closeEmojiKeyboard: () => {},
	setFocused: () => {},
	openSearchEmojiKeyboard: () => {},
	closeEmojiKeyboardAndAction: () => {}
});

type TMessageInnerContext = {
	sendMessage(): void;
	onEmojiSelected(emoji: IEmoji): void;
};

export const MessageInnerContext = createContext<TMessageInnerContext>({
	sendMessage: () => {},
	onEmojiSelected: () => {}
});

type State = {
	showEmojiKeyboard: boolean;
	showEmojiSearchbar: boolean;
	focused: boolean;
	trackingViewHeight: number;
	keyboardHeight: number;
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
	| { type: 'closeSearchEmojiKeyboard' };

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
	}
};

export const MessageComposerProvider = ({
	children,
	forwardedRef
}: {
	children: ReactElement;
	forwardedRef: any;
}): ReactElement => {
	const [state, dispatch] = useReducer(reducer, {} as State);

	useImperativeHandle(forwardedRef, () => ({
		closeEmojiKeyboardAndAction
	}));

	useBackHandler(() => {
		if (state.showEmojiSearchbar) {
			dispatch({ type: 'closeSearchEmojiKeyboard' });
			return true;
		}
		return false;
	});

	const closeEmojiKeyboardAndAction = (action?: Function, params?: any) => {
		dispatch({ type: 'closeEmojiKeyboard' });
		setTimeout(() => action && action(params), state.showEmojiKeyboard && isIOS ? TIMEOUT_CLOSE_EMOJI_KEYBOARD : undefined);
	};

	return (
		<MessageComposerContext.Provider
			value={{
				focused: state.focused,
				showEmojiKeyboard: state.showEmojiKeyboard,
				showEmojiSearchbar: state.showEmojiSearchbar,
				trackingViewHeight: state.trackingViewHeight,
				keyboardHeight: state.keyboardHeight,
				setFocused: (focused: boolean) => dispatch({ type: 'updateFocused', focused }),
				setKeyboardHeight: (keyboardHeight: number) => dispatch({ type: 'updateKeyboardHeight', keyboardHeight }),
				setTrackingViewHeight: (trackingViewHeight: number) => dispatch({ type: 'updateTrackingViewHeight', trackingViewHeight }),
				openEmojiKeyboard: () => dispatch({ type: 'openEmojiKeyboard' }),
				closeEmojiKeyboard: () => dispatch({ type: 'closeEmojiKeyboard' }),
				openSearchEmojiKeyboard: () => dispatch({ type: 'openSearchEmojiKeyboard' }),
				closeEmojiKeyboardAndAction
			}}
		>
			{children}
		</MessageComposerContext.Provider>
	);
};
