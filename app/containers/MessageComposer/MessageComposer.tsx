import React, { ReactElement, useRef, useImperativeHandle, useCallback } from 'react';
import { View, StyleSheet, NativeModules } from 'react-native';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';
import { useBackHandler } from '@react-native-community/hooks';
import { Q } from '@nozbe/watermelondb';

import { useRoomContext } from '../../views/RoomView/context';
import { Autocomplete, Toolbar, EmojiSearchbar, ComposerInput, Left, Right, Quotes, SendThreadToChannel } from './components';
import { MIN_HEIGHT, TIMEOUT_CLOSE_EMOJI_KEYBOARD } from './constants';
import {
	MessageInnerContext,
	useAlsoSendThreadToChannel,
	useMessageComposerApi,
	useRecordingAudio,
	useShowEmojiKeyboard,
	useShowEmojiSearchbar
} from './context';
import { IComposerInput, ITrackingView } from './interfaces';
import { isIOS } from '../../lib/methods/helpers';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import { useTheme } from '../../theme';
import { EventTypes } from '../EmojiPicker/interfaces';
import { IEmoji } from '../../definitions';
import database from '../../lib/database';
import { sanitizeLikeString } from '../../lib/database/utils';
import { generateTriggerId } from '../../lib/methods';
import { Services } from '../../lib/services';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { prepareQuoteMessage } from './helpers';
import { RecordAudio } from './components/RecordAudio';
import { useKeyboardListener } from './hooks';

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

export const MessageComposer = ({ forwardedRef }: { forwardedRef: any }): ReactElement | null => {
	console.count('[MessageComposer] MessageComposer');
	const composerInputRef = useRef(null);
	const composerInputComponentRef = useRef<IComposerInput>({
		getTextAndClear: () => '',
		getText: () => '',
		getSelection: () => ({ start: 0, end: 0 }),
		setInput: () => {},
		onAutocompleteItemSelected: () => {}
	});
	const trackingViewRef = useRef<ITrackingView>({ resetTracking: () => {}, getNativeProps: () => ({ trackingViewHeight: 0 }) });
	const { colors, theme } = useTheme();
	const { rid, tmid, action, selectedMessages, editRequest, onSendMessage } = useRoomContext();
	const showEmojiKeyboard = useShowEmojiKeyboard();
	const showEmojiSearchbar = useShowEmojiSearchbar();
	const alsoSendThreadToChannel = useAlsoSendThreadToChannel();
	const { openSearchEmojiKeyboard, closeEmojiKeyboard, closeSearchEmojiKeyboard } = useMessageComposerApi();
	const recordingAudio = useRecordingAudio();
	useKeyboardListener(trackingViewRef);

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

		if (action === 'edit') {
			return editRequest({ id: selectedMessages[0], msg: textFromInput, rid });
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
					await Services.runSlashCommand(command, rid, messageWithoutCommand, triggerId, tmid);
				} catch (e) {
					log(e);
				}
				return;
			}
		}

		// Text message
		onSendMessage(textFromInput, alsoSendThreadToChannel);
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

	const backgroundColor = action === 'edit' ? colors.statusBackgroundWarning2 : colors.surfaceLight;

	const renderContent = useCallback(() => {
		console.count('[MessageComposer] renderContent');
		if (recordingAudio) {
			return <RecordAudio />;
		}
		return (
			<View style={[styles.container, { backgroundColor, borderTopColor: colors.strokeLight }]} testID='message-composer'>
				<View style={styles.input}>
					<Left />
					<ComposerInput ref={composerInputComponentRef} inputRef={composerInputRef} />
					<Right />
				</View>
				<Quotes />
				<Toolbar />
				<EmojiSearchbar />
				<SendThreadToChannel />
			</View>
		);
	}, [recordingAudio]);

	return (
		<MessageInnerContext.Provider value={{ sendMessage, onEmojiSelected, closeEmojiKeyboardAndAction }}>
			<KeyboardAccessoryView
				ref={(ref: ITrackingView) => (trackingViewRef.current = ref)}
				renderContent={renderContent}
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
			<Autocomplete onPress={composerInputComponentRef.current.onAutocompleteItemSelected} />
		</MessageInnerContext.Provider>
	);
};
