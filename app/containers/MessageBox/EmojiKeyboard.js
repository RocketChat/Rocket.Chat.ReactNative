import React from 'react';
import { View } from 'react-native';
import { KeyboardRegistry } from 'react-native-keyboard-input';

import EmojiPicker from '../EmojiPicker';

export default class EmojiKeyboard extends React.PureComponent {
	_onEmojiSelected = (emoji) => {
		console.warn(emoji);
	}
	render() {
		return (
			<View
				style={{
					flex: 1,
					borderTopColor: '#ECECEC',
					borderTopWidth: 1
				}}
			>
				<EmojiPicker onEmojiSelected={emoji => this._onEmojiSelected(emoji)} />
			</View>
		);
	}
}
KeyboardRegistry.registerKeyboard('EmojiKeyboard', () => EmojiKeyboard);
