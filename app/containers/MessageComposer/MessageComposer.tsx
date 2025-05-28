import React, { ReactElement, useRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import { useBackHandler } from '@react-native-community/hooks';
import { Q } from '@nozbe/watermelondb';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useRoomContext } from '../../views/RoomView/context';
import { Toolbar, EmojiSearchbar, ComposerInput, Left, Right, Quotes, SendThreadToChannel, Autocomplete } from './components';
import { MIN_HEIGHT } from './constants';
import {
	MessageInnerContext,
	useAlsoSendThreadToChannel,
	useMessageComposerApi,
	useRecordingAudio,
	useShowEmojiSearchbar
} from './context';
import { IComposerInput } from './interfaces';
import { useTheme } from '../../theme';
import { EventTypes } from '../EmojiPicker/interfaces';
import { IEmoji } from '../../definitions';
import database from '../../lib/database';
import { sanitizeLikeString } from '../../lib/database/utils';
import { generateTriggerId } from '../../lib/methods';
import { Services } from '../../lib/services';
import log from '../../lib/methods/helpers/log';
import { prepareQuoteMessage, insertEmojiAtCursor } from './helpers';
import { RecordAudio } from './components/RecordAudio';
import useShortnameToUnicode from '../../lib/hooks/useShortnameToUnicode';
import { useEmojiKeyboard, useEmojiKeyboardHeight } from './hooks/useEmojiKeyboard';
import EmojiPicker from '../EmojiPicker';

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

export const MessageComposer = ({
	forwardedRef,
	children
}: {
	forwardedRef: any;
	children?: ReactElement;
}): ReactElement | null => {
	const composerInputRef = useRef(null);
	const composerInputComponentRef = useRef<IComposerInput>({
		getTextAndClear: () => '',
		getText: () => '',
		getSelection: () => ({ start: 0, end: 0 }),
		setInput: () => {},
		onAutocompleteItemSelected: () => {}
	});
	const { colors } = useTheme();
	const { rid, tmid, action, selectedMessages, sharing, editRequest, onSendMessage } = useRoomContext();
	const showEmojiSearchbar = useShowEmojiSearchbar();
	const alsoSendThreadToChannel = useAlsoSendThreadToChannel();
	const { showEmojiPickerSharedValue, showEmojiKeyboard } = useEmojiKeyboard();
	const { keyboardHeight } = useEmojiKeyboardHeight();
	const { openSearchEmojiKeyboard, closeSearchEmojiKeyboard, setAlsoSendThreadToChannel, setAutocompleteParams } =
		useMessageComposerApi();
	const recordingAudio = useRecordingAudio();
	const { formatShortnameToUnicode } = useShortnameToUnicode();

	useImperativeHandle(forwardedRef, () => ({
		closeEmojiKeyboardAndAction,
		getText: composerInputComponentRef.current?.getText,
		setInput: composerInputComponentRef.current?.setInput
	}));

	useBackHandler(() => {
		if (showEmojiSearchbar) {
			closeSearchEmojiKeyboard();
			return true;
		}
		return false;
	});

	const closeEmojiKeyboardAndAction = (action?: Function, params?: any) => {
		showEmojiPickerSharedValue.value = false;
		action && action(params);
	};

	const handleSendMessage = async () => {
		if (!rid) return;

		if (alsoSendThreadToChannel) {
			setAlsoSendThreadToChannel(false);
		}

		if (sharing) {
			onSendMessage?.();
			return;
		}

		const textFromInput = composerInputComponentRef.current.getTextAndClear();

		if (action === 'edit') {
			return editRequest?.({ id: selectedMessages[0], msg: textFromInput, rid });
		}

		if (action === 'quote') {
			const quoteMessage = await prepareQuoteMessage(textFromInput, selectedMessages);
			onSendMessage?.(quoteMessage);
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

		// Hide autocomplete
		setAutocompleteParams({ text: '', type: null, params: '' });

		// Text message
		onSendMessage?.(textFromInput, alsoSendThreadToChannel);
	};

	const onKeyboardItemSelected = (eventType: EventTypes, emoji?: IEmoji) => {
		const text = composerInputComponentRef.current.getText();
		let newText = '';
		// if input has an active cursor
		const { start, end } = composerInputComponentRef.current.getSelection();
		const cursor = Math.max(start, end);
		let newCursor;

		switch (eventType) {
			case EventTypes.BACKSPACE_PRESSED:
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
				let emojiText = '';
				if (typeof emoji === 'string') {
					emojiText = formatShortnameToUnicode(`:${emoji}:`);
				} else if (emoji?.name) {
					emojiText = `:${emoji.name}:`;
				}
				const { updatedCursor, updatedText } = insertEmojiAtCursor(text, emojiText, cursor);
				composerInputComponentRef.current.setInput(updatedText, { start: updatedCursor, end: updatedCursor });
				break;
			case EventTypes.SEARCH_PRESSED:
				openSearchEmojiKeyboard();
				break;
			default:
			// Do nothing
		}
	};

	const onEmojiSelected = (emoji: IEmoji) => {
		onKeyboardItemSelected(EventTypes.EMOJI_PRESSED, emoji);
	};

	const backgroundColor = action === 'edit' ? colors.statusBackgroundWarning2 : colors.surfaceLight;

	const emojiKeyboardStyle = useAnimatedStyle(() => ({
		height: keyboardHeight.value
	}));

	const renderContent = () => {
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

				{children}
			</View>
		);
	};

	return (
		<MessageInnerContext.Provider value={{ sendMessage: handleSendMessage, onEmojiSelected, closeEmojiKeyboardAndAction }}>
			<Animated.View>{renderContent()}</Animated.View>
			<Animated.View style={emojiKeyboardStyle}>
				{showEmojiKeyboard ? <EmojiPicker onItemClicked={onKeyboardItemSelected} isEmojiKeyboard /> : null}
			</Animated.View>
			<Autocomplete onPress={item => composerInputComponentRef.current.onAutocompleteItemSelected(item)} />
		</MessageInnerContext.Provider>
	);
};
