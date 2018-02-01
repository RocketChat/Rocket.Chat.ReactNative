import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, Text, View } from 'react-native';
import { KeyboardRegistry } from 'react-native-keyboard-input';

import EmojiPicker from '../EmojiPicker';

export default class EmojiKeyboard extends React.PureComponent {
	static propTypes = {
		title: PropTypes.string
	};
	_onEmojiSelected = (emoji) => {
		console.warn(emoji)
	}
	render() {
		return (
			// <ScrollView contentContainerStyle={{ flex: 1, backgroundColor: 'purple' }}>
			// 	<Text style={{color: 'white'}}>HELOOOO!!!</Text>
			// 	<Text style={{color: 'white'}}>EMOJI</Text>
			// </ScrollView>
			<View style={{
				height: 200,
				borderTopColor: '#ECECEC',
				borderTopWidth: 1,
				backgroundColor: '#fff'
			}}>
				<EmojiPicker onEmojiSelected={emoji => this._onEmojiSelected(emoji)} />
			</View>
		);
	}
}
KeyboardRegistry.registerKeyboard('EmojiKeyboard', () => EmojiKeyboard);
