import React from 'react';
import { View } from 'react-native';
import { KeyboardRegistry } from 'react-native-keyboard-input';
import PropTypes from 'prop-types';

import store from '../../lib/createStore';
import EmojiPicker from '../EmojiPicker';
import styles from './styles';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';

export default class EmojiKeyboard extends React.PureComponent {
	static propTypes = {
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		const state = store.getState();
		this.baseUrl = state.server.server;
	}

	onEmojiSelected = (emoji) => {
		KeyboardRegistry.onItemSelected('EmojiKeyboard', { emoji });
	}

	render() {
		const { theme } = this.props;
		return (
			<View style={[styles.emojiKeyboardContainer, { borderTopColor: themes[theme].borderColor }]} testID='messagebox-keyboard-emoji'>
				<EmojiPicker onEmojiSelected={this.onEmojiSelected} baseUrl={this.baseUrl} />
			</View>
		);
	}
}
KeyboardRegistry.registerKeyboard('EmojiKeyboard', () => withTheme(EmojiKeyboard));
