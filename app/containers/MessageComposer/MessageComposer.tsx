import React, { useState, ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';

import { useTheme } from '../../theme';
import { MessageComposerToolbar } from './Toolbar';
import { MessageComposerInput } from './MessageComposerInput';
import { MessageComposerContext } from './context';
import { IMessageBoxProps, TMicOrSend } from './interfaces';

const styles = StyleSheet.create({
	container: {
		borderTopWidth: 1
	}
});

export const MessageComposer = ({ onSubmit }: IMessageBoxProps): ReactElement => {
	console.count('Message Composer');
	const { colors, theme } = useTheme();
	const [micOrSend, setMicOrSend] = useState<TMicOrSend>('mic');

	const renderContent = () => (
		<View style={[styles.container, { backgroundColor: colors.surfaceLight, borderTopColor: colors.strokeLight }]}>
			<MessageComposerInput />
			<MessageComposerToolbar />
		</View>
	);

	const sendMessage = () => {
		console.log('sendMessage');
		// onSubmit()
	};

	return (
		<MessageComposerContext.Provider value={{ micOrSend, setMicOrSend, sendMessage }}>
			<KeyboardAccessoryView
				// ref={(ref: any) => (this.tracking = ref)}
				renderContent={renderContent}
				// kbInputRef={this.component}
				// kbComponent={showEmojiKeyboard ? 'EmojiKeyboard' : null}
				kbInitialProps={{ theme }}
				// onKeyboardResigned={this.onKeyboardResigned}
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
