import React, { useState, ReactElement, useRef } from 'react';
import { View, StyleSheet, NativeModules } from 'react-native';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';

import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import { useAppSelector } from '../../lib/hooks';
import { useTheme } from '../../theme';
import { MessageComposerToolbar } from './Toolbar';
import { MessageComposerInput } from './MessageComposerInput';
import { MessageComposerContext } from './context';
import { IComposerInput, IMessageComposerProps, ITrackingView, TMicOrSend } from './interfaces';
import { EventTypes } from '../EmojiPicker/interfaces';
import { IEmoji } from '../../definitions';
import EmojiSearchBar from './EmojiSearchbar';
import { useCanUploadFile, useChooseMedia } from './hooks';

const styles = StyleSheet.create({
	container: {
		borderTopWidth: 1
	}
});

require('../MessageBox/EmojiKeyboard');

export const MessageComposer = ({ onSendMessage, rid, tmid, sharing = false }: IMessageComposerProps): ReactElement => {
	// console.count('Message Composer');
	const composerInputRef = useRef(null);
	const composerInputComponentRef = useRef<IComposerInput>({
		sendMessage: () => '',
		getText: () => '',
		getSelection: () => ({ start: 0, end: 0 }),
		setInput: () => {}
	});
	const trackingViewRef = useRef<ITrackingView>({ resetTracking: () => {} });
	const { colors, theme } = useTheme();
	const [micOrSend, setMicOrSend] = useState<TMicOrSend>('mic');
	const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
	const [showEmojiSearchbar, setShowEmojiSearchbar] = useState(false);
	const permissionToUpload = useCanUploadFile(rid);
	const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = useAppSelector(state => state.settings);
	const { takePhoto, takeVideo, chooseFromLibrary, chooseFile } = useChooseMedia({
		rid,
		tmid,
		allowList: FileUpload_MediaTypeWhiteList as string,
		maxFileSize: FileUpload_MaxFileSize as number,
		permissionToUpload
	});

	const sendMessage = () => {
		onSendMessage(composerInputComponentRef.current.sendMessage());
	};

	const onKeyboardResigned = () => {
		if (!showEmojiSearchbar) {
			closeEmojiKeyboard();
		}
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
				setShowEmojiKeyboard(false);
				setShowEmojiSearchbar(true);
				break;
			default:
			// Do nothing
		}
	};

	const openEmojiKeyboard = () => {
		// logEvent(events.ROOM_OPEN_EMOJI);
		setShowEmojiKeyboard(true);
		setShowEmojiSearchbar(false);
		// this.stopTrackingMention();
	};

	const closeEmojiKeyboard = () => {
		// TODO: log event
		setShowEmojiKeyboard(false);
		setShowEmojiSearchbar(false);
	};

	const onEmojiSelected = (emoji: IEmoji) => {
		onKeyboardItemSelected('EmojiKeyboard', { eventType: EventTypes.EMOJI_PRESSED, emoji });
	};

	return (
		<MessageComposerContext.Provider
			value={{
				micOrSend,
				rid,
				tmid,
				sharing,
				showEmojiKeyboard,
				showEmojiSearchbar,
				permissionToUpload,
				setMicOrSend,
				openEmojiKeyboard,
				closeEmojiKeyboard,
				onEmojiSelected,
				sendMessage,
				takePhoto,
				takeVideo,
				chooseFromLibrary,
				chooseFile
			}}
		>
			<KeyboardAccessoryView
				ref={(ref: ITrackingView) => (trackingViewRef.current = ref)}
				renderContent={() => (
					<View style={[styles.container, { backgroundColor: colors.surfaceLight, borderTopColor: colors.strokeLight }]}>
						<MessageComposerInput ref={composerInputComponentRef} inputRef={composerInputRef} />
						<MessageComposerToolbar />
						<EmojiSearchBar />
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
				bottomViewColor={colors.surfaceLight}
				iOSScrollBehavior={NativeModules.KeyboardTrackingViewTempManager?.KeyboardTrackingScrollBehaviorFixedOffset}
			/>
		</MessageComposerContext.Provider>
	);
};
