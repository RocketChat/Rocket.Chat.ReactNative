import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';

import sharedStyles from '../../views/Styles';
import { useTheme } from '../../theme';
import { MessageComposerToolbar } from './MessageComposerToolbar';

const styles = StyleSheet.create({
	container: {
		borderTopWidth: 1
	},
	textInput: {
		maxHeight: 240,
		paddingHorizontal: 16,
		paddingTop: 12,
		// TODO: check glitch on iOS selector pin with several lines
		paddingBottom: 12,
		fontSize: 16,
		// textAlignVertical: 'center',
		...sharedStyles.textRegular
	}
});

export const MessageComposer = () => {
	console.count('Message Composer');
	const { colors, theme } = useTheme();

	const renderContent = () => (
		<View style={[styles.container, { backgroundColor: colors.surfaceLight, borderTopColor: colors.strokeExtraLight }]}>
			<TextInput
				style={[styles.textInput, { color: colors.fontDefault }]}
				placeholder={`Message {ROOM}`}
				placeholderTextColor={colors.fontAnnotation}
				//
				// ref={component => (this.component = component)}
				blurOnSubmit={false}
				// onChangeText={this.onChangeText}
				// onSelectionChange={this.onSelectionChange}
				underlineColorAndroid='transparent'
				defaultValue=''
				multiline
				// testID={`messagebox-input${tmid ? '-thread' : ''}`}
				// {...isAndroidTablet}
			/>
			<MessageComposerToolbar />
		</View>
	);

	return (
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
	);
};
