import React, { ReactElement, useContext } from 'react';

import { MicOrSendButton, ActionsButton, BaseButton } from '..';
import { MessageComposerContext } from '../../context';
import { Container } from './Container';
import { EmptySpace } from './EmptySpace';

export const EmojiKeyboard = (): ReactElement => {
	const { closeEmojiKeyboard } = useContext(MessageComposerContext);

	return (
		<Container>
			<ActionsButton />
			<BaseButton
				onPress={() => closeEmojiKeyboard()}
				testID='message-composer-close-emoji'
				accessibilityLabel='Close_emoji_selector'
				icon='keyboard'
			/>
			<EmptySpace />
			<MicOrSendButton />
		</Container>
	);
};
