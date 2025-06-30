import React, { ReactElement } from 'react';

import { MicOrSendButton, ActionsButton, BaseButton } from '..';
import { useMessageComposerApi } from '../../context';
import { Container } from './Container';
import { EmptySpace } from './EmptySpace';
import { Gap } from '../Gap';

export const EmojiKeyboard = (): ReactElement => {
	const { closeEmojiKeyboard } = useMessageComposerApi();

	return (
		<Container>
			<ActionsButton />
			<Gap />
			<BaseButton
				onPress={closeEmojiKeyboard}
				testID='message-composer-close-emoji'
				accessibilityLabel='Back_to_keyboard'
				icon='keyboard'
			/>
			<EmptySpace />
			<MicOrSendButton />
		</Container>
	);
};
