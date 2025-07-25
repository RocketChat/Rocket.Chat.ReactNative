import React, { ReactElement } from 'react';
import { KeyboardController } from 'react-native-keyboard-controller';

import { MicOrSendButton, ActionsButton, BaseButton } from '..';
import { Container } from './Container';
import { EmptySpace } from './EmptySpace';
import { Gap } from '../Gap';
import { useEmojiKeyboard } from '../../hooks/useEmojiKeyboard';

export const EmojiKeyboard = (): ReactElement => {
	const { closeEmojiKeyboard } = useEmojiKeyboard();

	const close = async () => {
		closeEmojiKeyboard();
		await KeyboardController.setFocusTo('current');
	};

	return (
		<Container>
			<ActionsButton />
			<Gap />
			<BaseButton onPress={close} testID='message-composer-close-emoji' accessibilityLabel='Back_to_keyboard' icon='keyboard' />
			<EmptySpace />
			<MicOrSendButton />
		</Container>
	);
};
