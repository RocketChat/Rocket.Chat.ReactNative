import React, { ReactElement, useRef, useImperativeHandle, useCallback } from 'react';
import { View, StyleSheet, NativeModules } from 'react-native';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';
import { useBackHandler } from '@react-native-community/hooks';
import { Q } from '@nozbe/watermelondb';
import { useFocusEffect } from '@react-navigation/native';

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
import log from '../../lib/methods/helpers/log';
import { prepareQuoteMessage, insertEmojiAtCursor } from './helpers';
import { RecordAudio } from './components/RecordAudio';
import { useKeyboardListener } from './hooks';
import { emitter } from '../../lib/methods/helpers/emitter';

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

require('./components/EmojiKeyboard');

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
	const trackingViewRef = useRef<ITrackingView>({ resetTracking: () => {}, getNativeProps: () => ({ trackingViewHeight: 0 }) });
	const { colors, theme } = useTheme();
	const { rid, tmid, action, selectedMessages, sharing, editRequest, onSendMessage } = useRoomContext();
	const showEmojiKeyboard = useShowEmojiKeyboard();
	const showEmojiSearchbar = useShowEmojiSearchbar();
	const alsoSendThreadToChannel = useAlsoSendThreadToChannel();
	const {
		openSearchEmojiKeyboard,
		closeEmojiKeyboard,
		closeSearchEmojiKeyboard,
		setTrackingViewHeight,
		setAlsoSendThreadToChannel,
		setAutocompleteParams
	} = useMessageComposerApi();
	const recordingAudio = useRecordingAudio();
	useKeyboardListener(trackingViewRef);

	useFocusEffect(
		useCallback(() => {
			trackingViewRef.current?.resetTracking();
		}, [recordingAudio])
	);

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
		if (showEmojiKeyboard) {
			closeEmojiKeyboard();
		}
		setTimeout(() => action && action(params), showEmojiKeyboard && isIOS ? TIMEOUT_CLOSE_EMOJI_KEYBOARD : undefined);
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

	const onKeyboardItemSelected = (_keyboardId: string, params: { eventType: EventTypes; emoji: IEmoji }) => {
		const { eventType, emoji } = params;
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
					emojiText = shortnameToUnicode(`:${emoji}:`);
				} else {
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
		onKeyboardItemSelected('EmojiKeyboard', { eventType: EventTypes.EMOJI_PRESSED, emoji });
	};

	const onKeyboardResigned = () => {
		if (!showEmojiSearchbar) {
			closeEmojiKeyboard();
		}
	};

	const onHeightChanged = (height: number) => {
		setTrackingViewHeight(height);
		emitter.emit(`setComposerHeight${tmid ? 'Thread' : ''}`, height);
	};

	const backgroundColor = action === 'edit' ? colors.statusBackgroundWarning2 : colors.surfaceLight;

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
				onHeightChanged={onHeightChanged}
			/>
			<Autocomplete onPress={item => composerInputComponentRef.current.onAutocompleteItemSelected(item)} />
		</MessageInnerContext.Provider>
	);
};
