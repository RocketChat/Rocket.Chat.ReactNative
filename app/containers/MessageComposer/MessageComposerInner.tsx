import React, { ReactElement, useRef, useImperativeHandle, useContext, useEffect } from 'react';
import { View, StyleSheet, NativeModules, Keyboard } from 'react-native';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';
import { useBackHandler } from '@react-native-community/hooks';
import { Q } from '@nozbe/watermelondb';

import { useRoomContext } from '../../views/RoomView/context';
import { Autocomplete, Toolbar, EmojiSearchbar, ComposerInput, Left, Right } from './components';
import { MIN_HEIGHT, NO_CANNED_RESPONSES, TIMEOUT_CLOSE_EMOJI_KEYBOARD } from './constants';
import { MessageComposerContext, MessageInnerContext } from './context';
import { IAutocompleteItemProps, IComposerInput, ITrackingView } from './interfaces';
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
import { fetchIsAllOrHere, prepareQuoteMessage } from './helpers';
import Navigation from '../../lib/navigation/appNavigation';
import { emitter } from './emitter';
import { Quotes } from './components/Quotes';

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

export const MessageComposerInner = ({ forwardedRef }: { forwardedRef: any }): ReactElement | null => {
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
	const { rid, tmid, editing, message, action, selectedMessages, editRequest, onSendMessage } = useRoomContext();
	const {
		showEmojiKeyboard,
		showEmojiSearchbar,
		setKeyboardHeight,
		openSearchEmojiKeyboard,
		closeEmojiKeyboard,
		closeSearchEmojiKeyboard
	} = useContext(MessageComposerContext);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

	useEffect(() => {
		const showListener = Keyboard.addListener('keyboardWillShow', async () => {
			if (trackingViewRef?.current) {
				const props = await trackingViewRef.current.getNativeProps();
				setKeyboardHeight(props.keyboardHeight);
			}
		});

		const hideListener = Keyboard.addListener('keyboardWillHide', () => {
			setKeyboardHeight(0);
		});

		return () => {
			showListener.remove();
			hideListener.remove();
		};
	}, [trackingViewRef]);

	useImperativeHandle(forwardedRef, () => ({
		closeEmojiKeyboardAndAction
	}));

	useBackHandler(() => {
		if (showEmojiSearchbar) {
			closeSearchEmojiKeyboard();
			return true;
		}
		return false;
	});

	const closeEmojiKeyboardAndAction = (action?: Function, params?: any) => {
		if (showEmojiKeyboard) {
			closeEmojiKeyboard();
		}
		setTimeout(() => action && action(params), showEmojiKeyboard && isIOS ? TIMEOUT_CLOSE_EMOJI_KEYBOARD : undefined);
	};

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

		if (action === 'quote') {
			// TODO: missing threads and threads enabled implementation
			const quoteMessage = await prepareQuoteMessage(textFromInput, selectedMessages);
			onSendMessage(quoteMessage);
			return;
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

	const onAutocompleteItemSelected: IAutocompleteItemProps['onPress'] = async item => {
		if (item.type === 'loading') {
			return null;
		}

		// If it's slash command preview, we need to execute the command
		if (item.type === '/preview') {
			try {
				const db = database.active;
				const commandsCollection = db.get('slash_commands');
				const commandRecord = await commandsCollection.find(item.text);
				const { appId } = commandRecord;
				const triggerId = generateTriggerId(appId);
				Services.executeCommandPreview(item.text, item.params, rid, item.preview, triggerId, tmid);
			} catch (e) {
				log(e);
			}
			requestAnimationFrame(() => {
				stopAutocomplete();
				composerInputComponentRef.current.setInput('', { start: 0, end: 0 });
			});
			return;
		}

		// If it's canned response, but there's no canned responses, we open the canned responses view
		if (item.type === '!' && item.id === NO_CANNED_RESPONSES) {
			const params = { rid };
			if (isMasterDetail) {
				Navigation.navigate('ModalStackNavigator', { screen: 'CannedResponsesListView', params });
			} else {
				Navigation.navigate('CannedResponsesListView', params);
			}
			stopAutocomplete();
			return;
		}

		const text = composerInputComponentRef.current.getText();
		const { start, end } = composerInputComponentRef.current.getSelection();
		const cursor = Math.max(start, end);
		const regexp = getMentionRegexp();
		let result = text.substr(0, cursor).replace(regexp, '');
		// Remove the ! after select the canned response
		if (item.type === '!') {
			const lastIndexOfExclamation = text.lastIndexOf('!', cursor);
			result = text.substr(0, lastIndexOfExclamation).replace(regexp, '');
		}
		let mention = '';
		switch (item.type) {
			case '@':
				mention = fetchIsAllOrHere(item) ? item.title : item.subtitle || item.title;
				break;
			case '#':
				mention = item.subtitle ? item.subtitle : '';
				break;
			case ':':
				mention = `${typeof item.emoji === 'string' ? item.emoji : item.emoji.name}:`;
				break;
			case '/':
				mention = item.title;
				break;
			case '!':
				mention = item.subtitle ? item.subtitle : '';
				break;
			default:
				mention = '';
		}
		const newText = `${result}${mention} ${text.slice(cursor)}`;

		const newCursor = cursor + mention.length;
		composerInputComponentRef.current.setInput(newText, { start: newCursor, end: newCursor });
		composerInputComponentRef.current.focus();
		requestAnimationFrame(() => {
			stopAutocomplete();
		});
	};

	// TODO: duplicated
	const stopAutocomplete = () => {
		emitter.emit('setAutocomplete', { type: null, text: '', params: '' });
	};

	const backgroundColor = editing ? colors.statusBackgroundWarning2 : colors.surfaceLight;
	return (
		<MessageInnerContext.Provider value={{ sendMessage, onEmojiSelected, closeEmojiKeyboardAndAction }}>
			<KeyboardAccessoryView
				ref={(ref: ITrackingView) => (trackingViewRef.current = ref)}
				renderContent={() => (
					<View style={[styles.container, { backgroundColor, borderTopColor: colors.strokeLight }]} testID='message-composer'>
						<View style={styles.input}>
							<Left />
							<ComposerInput ref={composerInputComponentRef} inputRef={composerInputRef} />
							<Right />
						</View>
						<Quotes />
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
			<Autocomplete onPress={onAutocompleteItemSelected} />
		</MessageInnerContext.Provider>
	);
};
