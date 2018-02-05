import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { KeyboardRegistry } from 'react-native-keyboard-input';
import { Provider } from 'react-redux';
import store from '../../lib/createStore';
import EmojiPicker from '../EmojiPicker';

export default class EmojiKeyboard extends React.PureComponent {
	onEmojiSelected = (emoji) => {
		KeyboardRegistry.onItemSelected('EmojiKeyboard', { emoji });
	}
	render() {
		return (
			// <Provider store={store}>
			// 	<View
			// 		style={{
			// 			flex: 1,
			// 			borderTopColor: '#ECECEC',
			// 			borderTopWidth: 1
			// 		}}
			// 	>
			// 		<EmojiPicker onEmojiSelected={emoji => this.onEmojiSelected(emoji)} />
			// 	</View>
			// </Provider>
			<ScrollView contentContainerStyle={{ backgroundColor: 'orange', height: 800 }}>
				<Text>*** ANOTHER ONE ***</Text>
				<Text>{this.props.title}</Text>
			</ScrollView>
		);
	}
}
KeyboardRegistry.registerKeyboard('EmojiKeyboard', () => EmojiKeyboard);
