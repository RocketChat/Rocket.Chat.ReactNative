import React, { useState, ReactElement, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';

import { useTheme } from '../../theme';
import { MessageComposerToolbar } from './Toolbar';
import { MessageComposerInput } from './MessageComposerInput';
import { MessageComposerContext } from './context';
import { IComposerInput, IMessageComposerProps, ITrackingView, TMicOrSend } from './interfaces';

const styles = StyleSheet.create({
	container: {
		borderTopWidth: 1
	}
});

require('../MessageBox/EmojiKeyboard');

export const MessageComposer = ({ onSendMessage, rid, tmid, sharing = false }: IMessageComposerProps): ReactElement => {
	// console.count('Message Composer');
	const composerInputRef = useRef(null);
	const composerInputComponentRef = useRef<IComposerInput>({ sendMessage: () => '' });
	const trackingViewRef = useRef<ITrackingView>({ resetTracking: () => {} });
	const { colors, theme } = useTheme();
	const [micOrSend, setMicOrSend] = useState<TMicOrSend>('mic');
	const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
	const [showEmojiSearchbar, setShowEmojiSearchbar] = useState(false);
	console.log('🚀 ~ file: MessageComposer.tsx:26 ~ MessageComposer ~ showEmojiKeyboard:', showEmojiKeyboard);

	const renderContent = () => (
		<View style={[styles.container, { backgroundColor: colors.surfaceLight, borderTopColor: colors.strokeLight }]}>
			<MessageComposerInput ref={composerInputComponentRef} inputRef={composerInputRef} />
			<MessageComposerToolbar />
		</View>
	);

	const sendMessage = () => {
		onSendMessage(composerInputComponentRef.current.sendMessage());
	};

	const onKeyboardResigned = () => {
		if (!showEmojiSearchbar) {
			closeEmoji();
		}
	};

	const closeEmoji = () => {
		setShowEmojiKeyboard(false);
		setShowEmojiSearchbar(false);
	};

	return (
		<MessageComposerContext.Provider
			value={{ micOrSend, setMicOrSend, rid, tmid, sharing, showEmojiKeyboard, setShowEmojiKeyboard, sendMessage }}
		>
			<KeyboardAccessoryView
				ref={(ref: ITrackingView) => (trackingViewRef.current = ref)}
				renderContent={renderContent}
				kbInputRef={composerInputRef}
				kbComponent={showEmojiKeyboard ? 'EmojiKeyboard' : null}
				kbInitialProps={{ theme }}
				onKeyboardResigned={onKeyboardResigned}
				// onItemSelected={this.onKeyboardItemSelected}
				trackInteractive
				requiresSameParentToManageScrollView
				addBottomView
				bottomViewColor={colors.surfaceLight}
				// iOSScrollBehavior={iOSScrollBehavior}
			/>
		</MessageComposerContext.Provider>
	);
};
