import React from 'react';
import { View } from 'react-native';
import { KeyboardRegistry } from 'react-native-keyboard-input';
import { Provider } from 'react-redux';
import store from '../../lib/createStore';
import EmojiPicker from '../EmojiPicker';
import styles from './styles';

export default class EmojiKeyboard extends React.PureComponent {
	onEmojiSelected = (emoji) => {
		KeyboardRegistry.onItemSelected('EmojiKeyboard', { emoji });
	}
	render() {
		return (
			<Provider store={store}>
				<View style={styles.emojiKeyboardContainer} testID='messagebox-keyboard-emoji'>
					<EmojiPicker onEmojiSelected={emoji => this.onEmojiSelected(emoji)} />
				</View>
			</Provider>
		);
	}
}
KeyboardRegistry.registerKeyboard('EmojiKeyboard', () => EmojiKeyboard);
