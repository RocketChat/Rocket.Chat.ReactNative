import React, { ReactElement } from 'react';
import { KeyboardController } from 'react-native-keyboard-controller';

import { MicOrSendButton, ActionsButton, BaseButton } from '..';
import { useMessageComposerApi } from '../../context';
import { Container } from './Container';
import { EmptySpace } from './EmptySpace';
import { Gap } from '../Gap';
import { useEmojiKeyboard } from '../../hooks/useEmojiKeyboard';

export const EmojiKeyboard = (): ReactElement => {
	const { closeEmojiKeyboard } = useMessageComposerApi();
	const { showEmojiPickerSharedValue } = useEmojiKeyboard();

	const close = async () => {
		showEmojiPickerSharedValue.value = false;
		await KeyboardController.setFocusTo('current');
		// closeEmojiKeyboard();
	};

	return (
		<Container>
			<ActionsButton />
			<Gap />
			<BaseButton
				onPress={close}
				testID='message-composer-close-emoji'
				accessibilityLabel='Close_emoji_selector'
				icon='keyboard'
			/>
			<EmptySpace />
			<MicOrSendButton />
		</Container>
	);
};
