import { type ReactElement, useContext } from 'react';
import { KeyboardController } from 'react-native-keyboard-controller';

import { MicOrSendButton, ActionsButton, BaseButton } from '../Buttons';
import { Container } from './Container';
import { EmptySpace } from './EmptySpace';
import { Gap } from '../Gap';
import { useEmojiKeyboard } from '~/containers/MessageComposer/hooks/useEmojiKeyboard';
import { MessageInnerContext } from '~/containers/MessageComposer/context';

export const EmojiKeyboard = (): ReactElement => {
	const { closeEmojiKeyboard } = useEmojiKeyboard();

	const { focus } = useContext(MessageInnerContext);

	const close = async () => {
		closeEmojiKeyboard();
		await KeyboardController.setFocusTo('current');
		focus();
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
