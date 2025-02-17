import React from 'react';
import { View } from 'react-native';
import { Keyboard } from 'react-native-ui-lib';
import { Provider } from 'react-redux';

import store from '../../../lib/store';
import EmojiPicker from '../../EmojiPicker';
import { ThemeContext, type TSupportedThemes } from '../../../theme';
import { EventTypes } from '../../EmojiPicker/interfaces';
import type { IEmoji } from '../../../definitions';
import { colors } from '../../../lib/constants';

const EmojiKeyboard = ({ theme }: { theme: TSupportedThemes }) => {
	const onItemClicked = (eventType: EventTypes, emoji?: IEmoji) => {
		Keyboard.KeyboardRegistry.onItemSelected('EmojiKeyboard', { eventType, emoji });
	};

	return (
		<Provider store={store}>
			<ThemeContext.Provider
				value={{
					theme,
					colors: colors[theme]
				}}>
				<View style={{ flex: 1 }} testID='message-composer-keyboard-emoji'>
					<EmojiPicker onItemClicked={onItemClicked} isEmojiKeyboard={true} />
				</View>
			</ThemeContext.Provider>
		</Provider>
	);
};

Keyboard.KeyboardRegistry.registerKeyboard('EmojiKeyboard', () => EmojiKeyboard);
