import React, { useState, ReactElement, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { View, StyleSheet, NativeModules } from 'react-native';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';
import { useBackHandler } from '@react-native-community/hooks';

import { Toolbar, EmojiSearchbar, ComposerInput, Left, Right } from './components';
import { MIN_HEIGHT, TIMEOUT_CLOSE_EMOJI_KEYBOARD } from './constants';
import { MessageComposerContext } from './context';
import { useCanUploadFile, useChooseMedia } from './hooks';
import { IComposerInput, IMessageComposerProps, IMessageComposerRef, ITrackingView, TMicOrSend } from './interfaces';
import { isIOS } from '../../lib/methods/helpers';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import { useAppSelector } from '../../lib/hooks';
import { useTheme } from '../../theme';
import { EventTypes } from '../EmojiPicker/interfaces';
import { IEmoji } from '../../definitions';

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

export const MessageComposer = forwardRef<IMessageComposerRef, IMessageComposerProps>(
	({ onSendMessage, rid, tmid, sharing = false, editing = false, message, editCancel, editRequest }, ref): ReactElement => {
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
		const [focused, setFocused] = useState(false);
		const permissionToUpload = useCanUploadFile(rid);
		const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = useAppSelector(state => state.settings);
		const { takePhoto, takeVideo, chooseFromLibrary, chooseFile } = useChooseMedia({
			rid,
			tmid,
			allowList: FileUpload_MediaTypeWhiteList as string,
			maxFileSize: FileUpload_MaxFileSize as number,
			permissionToUpload
		});

		useBackHandler(() => {
			if (showEmojiSearchbar) {
				setShowEmojiSearchbar(false);
				return true;
			}
			return false;
		});

		useImperativeHandle(ref, () => ({
			closeEmojiKeyboardAndAction
		}));

		const sendMessage = () => {
			if (editing && message?.id && editRequest) {
				const msg = composerInputComponentRef.current.sendMessage();
				const {
					id,
					// @ts-ignore
					subscription: { id: rid }
				} = message;
				return editRequest({ id, msg, rid });
			}
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

		const closeEmojiKeyboardAndAction = (action?: Function, params?: any) => {
			closeEmojiKeyboard();
			setTimeout(() => action && action(params), showEmojiKeyboard && isIOS ? TIMEOUT_CLOSE_EMOJI_KEYBOARD : undefined);
		};

		const onEmojiSelected = (emoji: IEmoji) => {
			onKeyboardItemSelected('EmojiKeyboard', { eventType: EventTypes.EMOJI_PRESSED, emoji });
		};

		const backgroundColor = useMemo(
			() => (editing ? colors.statusBackgroundWarning2 : colors.surfaceLight),
			[colors.statusBackgroundWarning2, colors.surfaceLight, editing]
		);

		return (
			<MessageComposerContext.Provider
				value={{
					micOrSend,
					rid,
					tmid,
					editing,
					sharing,
					focused,
					setFocused,
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
					chooseFile,
					closeEmojiKeyboardAndAction,
					message,
					editCancel,
					editRequest
				}}
			>
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
			</MessageComposerContext.Provider>
		);
	}
);
