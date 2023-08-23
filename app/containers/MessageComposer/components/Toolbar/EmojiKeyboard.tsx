import React, { ReactElement } from 'react';

import { MicOrSendButton, ActionsButton, BaseButton } from '..';
import { useMessageComposerApi } from '../../context';
import { Container } from './Container';
import { EmptySpace } from './EmptySpace';

export const EmojiKeyboard = (): ReactElement => {
	const { closeEmojiKeyboard } = useMessageComposerApi();

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
