import React, { ReactElement, useRef, useImperativeHandle } from 'react';
import { AccessibilityInfo, findNodeHandle, LayoutChangeEvent } from 'react-native';
import { useBackHandler } from '@react-native-community/hooks';
import { Q } from '@nozbe/watermelondb';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useRoomContext } from '../../views/RoomView/context';
import { Autocomplete } from './components';
import { MIN_HEIGHT } from './constants';
import { MessageInnerContext, useAlsoSendThreadToChannel, useMessageComposerApi, useRecordingAudio } from './context';
import { IComposerInput } from './interfaces';
import { EventTypes } from '../EmojiPicker/interfaces';
import { IEmoji } from '../../definitions';
import database from '../../lib/database';
import { sanitizeLikeString } from '../../lib/database/utils';
import { generateTriggerId } from '../../lib/methods';
import { Services } from '../../lib/services';
import log from '../../lib/methods/helpers/log';
import { prepareQuoteMessage, insertEmojiAtCursor, insertTimestampAtCursor } from './helpers';
import useShortnameToUnicode from '../../lib/hooks/useShortnameToUnicode';
import { useCloseKeyboardWhenOrientationChanges } from './hooks/useCloseKeyboardWhenOrientationChanges';
import { useEmojiKeyboard } from './hooks/useEmojiKeyboard';
import { useTimestampPicker } from './hooks/useTimestampPicker';
import EmojiPicker from '../EmojiPicker';
import { TimestampPicker } from './components/TimestampPicker';
import { MessageComposerContent } from './components/MessageComposerContent';
import { useTheme } from '../../theme';

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
		onAutocompleteItemSelected: () => {},
		focus: () => {}
	});
	const contentHeight = useSharedValue(MIN_HEIGHT);
	useCloseKeyboardWhenOrientationChanges();
	const { rid, tmid, action, selectedMessages, sharing, editRequest, onSendMessage } = useRoomContext();
	const alsoSendThreadToChannel = useAlsoSendThreadToChannel();
	const { showEmojiKeyboard, showEmojiSearchbar, openEmojiSearchbar, resetKeyboard, keyboardHeight } = useEmojiKeyboard();
	const { showTimestampPicker, closeTimestampPicker } = useTimestampPicker();
	const { setAlsoSendThreadToChannel, setAutocompleteParams } = useMessageComposerApi();
	const recordingAudio = useRecordingAudio();
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const { colors } = useTheme();

	useImperativeHandle(forwardedRef, () => ({
		closeEmojiKeyboardAndAction,
		getText: composerInputComponentRef.current?.getText,
		setInput: composerInputComponentRef.current?.setInput
	}));

	useBackHandler(() => {
		if (showEmojiSearchbar) {
			resetKeyboard();
			return true;
		}
		return false;
	});

	const closeEmojiKeyboardAndAction = (action?: Function, params?: any) => {
		resetKeyboard();
		action && action(params);
	};

	const handleLayout = (event: LayoutChangeEvent) => {
		const { height } = event.nativeEvent.layout;
		contentHeight.value = height;
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
				openEmojiSearchbar();
				break;
			default:
			// Do nothing
		}
	};

	const onEmojiSelected = (emoji: IEmoji) => {
		onKeyboardItemSelected(EventTypes.EMOJI_PRESSED, emoji);
	};

	const onTimestampInsert = (timestamp: string) => {
		const text = composerInputComponentRef.current.getText();
		const { start, end } = composerInputComponentRef.current.getSelection();
		const cursor = Math.max(start, end);

		const { updatedText, updatedCursor } = insertTimestampAtCursor(text, timestamp, cursor);
		
		composerInputComponentRef.current.setInput(updatedText, { start: updatedCursor, end: updatedCursor });
		closeTimestampPicker();
	};

	const accessibilityFocusOnInput = () => {
		const node = findNodeHandle(composerInputRef.current);
		if (node) {
			AccessibilityInfo.setAccessibilityFocus(node);
		}
	};

	const emojiKeyboardStyle = useAnimatedStyle(() => ({
		height: keyboardHeight.value
	}));

	const autocompleteStyle = useAnimatedStyle(() => ({
		bottom: keyboardHeight.value + contentHeight.value - 4
	}));

	return (
		<MessageInnerContext.Provider
			value={{
				sendMessage: handleSendMessage,
				onEmojiSelected,
				closeEmojiKeyboardAndAction,
				focus: composerInputComponentRef.current?.focus
			}}>
			<MessageComposerContent
				recordingAudio={recordingAudio}
				action={action}
				composerInputComponentRef={composerInputComponentRef}
				composerInputRef={composerInputRef}
				onLayout={handleLayout}>
				{children}
			</MessageComposerContent>
			<Animated.View style={[emojiKeyboardStyle, { backgroundColor: colors.surfaceLight }]}>
				{showEmojiKeyboard && !showEmojiSearchbar ? <EmojiPicker onItemClicked={onKeyboardItemSelected} isEmojiKeyboard /> : null}
			</Animated.View>
			{showTimestampPicker && <TimestampPicker onInsert={onTimestampInsert} onClose={closeTimestampPicker} />}
			<Autocomplete
				onPress={item => composerInputComponentRef.current.onAutocompleteItemSelected(item)}
				style={autocompleteStyle}
				accessibilityFocusOnInput={accessibilityFocusOnInput}
			/>
		</MessageInnerContext.Provider>
	);
};
