import React from 'react';
import { View } from 'react-native';
import { KeyboardRegistry } from 'react-native-ui-lib/keyboard';
import { Provider } from 'react-redux';

import store from '../../lib/store';
import EmojiPicker from '../EmojiPicker';
import styles from './styles';
import { themes } from '../../lib/constants';
import { TSupportedThemes } from '../../theme';

const EmojiKeyboard = ({ theme }: { theme: TSupportedThemes }) => {
	const onEmojiSelected = (emoji: string) => {
		KeyboardRegistry.onItemSelected('EmojiKeyboard', { emoji });
	};

	return (
		<Provider store={store}>
			<View
				style={[styles.emojiKeyboardContainer, { borderTopColor: themes[theme].borderColor }]}
				testID='messagebox-keyboard-emoji'>
				<EmojiPicker onEmojiSelected={onEmojiSelected} theme={theme} />
			</View>
		</Provider>
	);
};

KeyboardRegistry.registerKeyboard('EmojiKeyboard', () => EmojiKeyboard);
