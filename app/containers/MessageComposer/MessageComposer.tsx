import React, { ReactElement, useRef, forwardRef, useImperativeHandle, useReducer, useContext } from 'react';
import { View, StyleSheet, NativeModules, Keyboard } from 'react-native';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';
import { useBackHandler } from '@react-native-community/hooks';
import { Q } from '@nozbe/watermelondb';

import { Autocomplete, Toolbar, EmojiSearchbar, ComposerInput, Left, Right } from './components';
import { MIN_HEIGHT, NO_CANNED_RESPONSES, TIMEOUT_CLOSE_EMOJI_KEYBOARD } from './constants';
import { MessageComposerContext, MessageComposerContextProps, MessageInnerContext } from './context';
import { IAutocompleteItemProps, IComposerInput, IMessageComposerProps, IMessageComposerRef, ITrackingView } from './interfaces';
import { isIOS } from '../../lib/methods/helpers';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import { useAppSelector } from '../../lib/hooks';
import { useTheme } from '../../theme';
import { EventTypes } from '../EmojiPicker/interfaces';
import { IEmoji } from '../../definitions';
import getMentionRegexp from '../MessageBox/getMentionRegexp';
import database from '../../lib/database';
import { sanitizeLikeString } from '../../lib/database/utils';
import { generateTriggerId } from '../../lib/methods';
import { Services } from '../../lib/services';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { isAllOrHere } from './helpers';
import Navigation from '../../lib/navigation/appNavigation';
import { emitter } from './emitter';

const styles = StyleSheet.create({
	container: {
		borderTopWidth: 1,
		paddingHorizontal: 16,
		minHeight: MIN_HEIGHT
	},
	input: {
		flexDirection: 'row'
	}
});

require('../MessageBox/EmojiKeyboard');

type State = {
	showEmojiKeyboard: boolean;
	showEmojiSearchbar: boolean;
	focused: boolean;
	trackingViewHeight: number;
	keyboardHeight: number;
	// sendMessage,
	// setTrackingViewHeight
	// openEmojiKeyboard,
	// closeEmojiKeyboard,
	// onEmojiSelected,
	// closeEmojiKeyboardAndAction
};

type Actions =
	| { type: 'updateEmojiKeyboard'; showEmojiKeyboard: boolean }
	| { type: 'updateEmojiSearchbar'; showEmojiSearchbar: boolean }
	| { type: 'updateFocused'; focused: boolean }
	| { type: 'updateTrackingViewHeight'; trackingViewHeight: number }
	| { type: 'updateKeyboardHeight'; keyboardHeight: number }
	| { type: 'openEmojiKeyboard' }
	| { type: 'closeEmojiKeyboard' }
	| { type: 'openSearchEmojiKeyboard' };

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
	}
};

const MessageComposerProvider = ({ children, forwardedRef }: { children: ReactElement; forwardedRef: any }): ReactElement => {
	const [state, dispatch] = useReducer(reducer, {} as State);

	useImperativeHandle(forwardedRef, () => ({
		closeEmojiKeyboardAndAction: (action?: Function, params?: any) => {
			// closeEmojiKeyboard(); TODO: close it
			setTimeout(() => action && action(params), state.showEmojiKeyboard && isIOS ? TIMEOUT_CLOSE_EMOJI_KEYBOARD : undefined);
		}
	}));

	return (
		<MessageComposerContext.Provider
			value={{
				focused: state.focused,
				setFocused: (focused: boolean) => dispatch({ type: 'updateFocused', focused }),
				showEmojiKeyboard: state.showEmojiKeyboard,
				showEmojiSearchbar: state.showEmojiSearchbar,
				trackingViewHeight: state.trackingViewHeight,
				keyboardHeight: state.keyboardHeight,
				setTrackingViewHeight: (trackingViewHeight: number) => dispatch({ type: 'updateTrackingViewHeight', trackingViewHeight }),
				openEmojiKeyboard: () => dispatch({ type: 'openEmojiKeyboard' }),
				closeEmojiKeyboard: () => dispatch({ type: 'closeEmojiKeyboard' }),
				openSearchEmojiKeyboard: () => dispatch({ type: 'openSearchEmojiKeyboard' })
			}}
		>
			{children}
		</MessageComposerContext.Provider>
	);
};

const Inner = (): ReactElement => {
	const composerInputRef = useRef(null);
	const composerInputComponentRef = useRef<IComposerInput>({
		getTextAndClear: () => '',
		getText: () => '',
		getSelection: () => ({ start: 0, end: 0 }),
		setInput: () => {},
		focus: () => {}
	});
	const trackingViewRef = useRef<ITrackingView>({ resetTracking: () => {}, getNativeProps: () => ({ trackingViewHeight: 0 }) });
	const { colors, theme } = useTheme();
	const { rid, tmid, editing, message, editRequest, onSendMessage } = useContext(MessageComposerContextProps);
	const { showEmojiKeyboard, showEmojiSearchbar, openSearchEmojiKeyboard, closeEmojiKeyboard } =
		useContext(MessageComposerContext);

	const sendMessage = async () => {
		const textFromInput = composerInputComponentRef.current.getTextAndClear();

		if (editing && message?.id && editRequest) {
			const {
				id,
				// @ts-ignore
				subscription: { id: rid }
			} = message;
			// @ts-ignore
			return editRequest({ id, msg: textFromInput, rid });
		}

		// Slash command
		if (textFromInput[0] === '/') {
			const db = database.active;
			const commandsCollection = db.get('slash_commands');
			const command = textFromInput.replace(/ .*/, '').slice(1);
			const likeString = sanitizeLikeString(command);
			const slashCommand = await commandsCollection.query(Q.where('id', Q.like(`${likeString}%`))).fetch();
			if (slashCommand.length > 0) {
				logEvent(events.COMMAND_RUN);
				try {
					const messageWithoutCommand = textFromInput.replace(/([^\s]+)/, '').trim();
					const [{ appId }] = slashCommand;
					const triggerId = generateTriggerId(appId);
					await Services.runSlashCommand(command, rid, messageWithoutCommand, triggerId, tmid); // || messageTmid);
					// replyCancel();
				} catch (e) {
					log(e);
				}
				return;
			}
		}

		// Text message
		onSendMessage(textFromInput);
	};

	const onKeyboardItemSelected = (_keyboardId: string, params: { eventType: EventTypes; emoji: IEmoji }) => {
		const { eventType, emoji } = params;
		const text = composerInputComponentRef.current.getText();
		let newText = '';
		// if messagebox has an active cursor
		const { start, end } = composerInputComponentRef.current.getSelection();
		const cursor = Math.max(start, end);
		let newCursor;

		switch (eventType) {
			case EventTypes.BACKSPACE_PRESSED:
				// logEvent(events.MB_BACKSPACE);
				const emojiRegex = /\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]/;
				let charsToRemove = 1;
				const lastEmoji = text.substr(cursor > 0 ? cursor - 2 : text.length - 2, cursor > 0 ? cursor : text.length);
				// Check if last character is an emoji
				if (emojiRegex.test(lastEmoji)) charsToRemove = 2;
				newText =
					text.substr(0, (cursor > 0 ? cursor : text.length) - charsToRemove) + text.substr(cursor > 0 ? cursor : text.length);
				newCursor = cursor - charsToRemove;
				composerInputComponentRef.current.setInput(newText, { start: newCursor, end: newCursor });
				break;
			case EventTypes.EMOJI_PRESSED:
				// logEvent(events.MB_EMOJI_SELECTED);
				let emojiText = '';
				if (typeof emoji === 'string') {
					const shortname = `:${emoji}:`;
					emojiText = shortnameToUnicode(shortname);
				} else {
					emojiText = `:${emoji.name}:`;
				}
				newText = `${text.substr(0, cursor)}${emojiText}${text.substr(cursor)}`;
				newCursor = cursor + emojiText.length;
				composerInputComponentRef.current.setInput(newText, { start: newCursor, end: newCursor });
				break;
			case EventTypes.SEARCH_PRESSED:
				// logEvent(events.MB_EMOJI_SEARCH_PRESSED);
				openSearchEmojiKeyboard();
				break;
			default:
			// Do nothing
		}
	};

	const onEmojiSelected = (emoji: IEmoji) => {
		onKeyboardItemSelected('EmojiKeyboard', { eventType: EventTypes.EMOJI_PRESSED, emoji });
	};

	const onKeyboardResigned = () => {
		if (!showEmojiSearchbar) {
			closeEmojiKeyboard();
		}
	};

	const backgroundColor = editing ? colors.statusBackgroundWarning2 : colors.surfaceLight;
	return (
		<MessageInnerContext.Provider value={{ sendMessage, onEmojiSelected }}>
			<KeyboardAccessoryView
				ref={(ref: ITrackingView) => (trackingViewRef.current = ref)}
				renderContent={() => (
					<View style={[styles.container, { backgroundColor, borderTopColor: colors.strokeLight }]} testID='message-composer'>
						<View style={styles.input}>
							<Left />
							<ComposerInput ref={composerInputComponentRef} inputRef={composerInputRef} />
							<Right />
						</View>
						<Toolbar />
						<EmojiSearchbar />
					</View>
				)}
				kbInputRef={composerInputRef}
				kbComponent={showEmojiKeyboard ? 'EmojiKeyboard' : null}
				kbInitialProps={{ theme }}
				onKeyboardResigned={onKeyboardResigned}
				onItemSelected={onKeyboardItemSelected}
				trackInteractive
				requiresSameParentToManageScrollView
				addBottomView
				bottomViewColor={backgroundColor}
				iOSScrollBehavior={NativeModules.KeyboardTrackingViewTempManager?.KeyboardTrackingScrollBehaviorFixedOffset}
			/>
			{/* <Autocomplete onPress={onAutocompleteItemSelected} /> */}
		</MessageInnerContext.Provider>
	);
};

export const MessageComposer = forwardRef<IMessageComposerRef, IMessageComposerProps>(
	({ onSendMessage, rid, tmid, sharing = false, editing = false, message, editCancel, editRequest }, ref): ReactElement => (
		// console.count('Message Composer');

		<MessageComposerContextProps.Provider
			value={{
				rid,
				tmid,
				editing,
				sharing,
				message,
				editCancel,
				editRequest,
				onSendMessage
			}}
		>
			<MessageComposerProvider forwardedRef={ref}>
				<Inner />
			</MessageComposerProvider>
		</MessageComposerContextProps.Provider>
	)
);
