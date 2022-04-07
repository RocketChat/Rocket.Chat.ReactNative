import React from 'react';
import { View } from 'react-native';
import { KeyboardRegistry } from 'react-native-ui-lib/keyboard';

import { store } from '../../lib/store/auxStore';
import EmojiPicker from '../EmojiPicker';
import styles from './styles';
import { themes } from '../../lib/constants';
import { withTheme } from '../../theme';
import { IEmoji } from '../../definitions/IEmoji';

interface IMessageBoxEmojiKeyboard {
	theme: string;
}

export default class EmojiKeyboard extends React.PureComponent<IMessageBoxEmojiKeyboard, any> {
	private readonly baseUrl: string;

	constructor(props: IMessageBoxEmojiKeyboard) {
		super(props);
		const state = store.getState();
		this.baseUrl = state.share.server.server || state.server.server;
	}

	onEmojiSelected = (emoji: IEmoji) => {
		KeyboardRegistry.onItemSelected('EmojiKeyboard', { emoji });
	};

	render() {
		const { theme } = this.props;
		return (
			<View
				style={[styles.emojiKeyboardContainer, { borderTopColor: themes[theme].borderColor }]}
				testID='messagebox-keyboard-emoji'>
				<EmojiPicker onEmojiSelected={this.onEmojiSelected} baseUrl={this.baseUrl} />
			</View>
		);
	}
}
KeyboardRegistry.registerKeyboard('EmojiKeyboard', () => withTheme(EmojiKeyboard));
