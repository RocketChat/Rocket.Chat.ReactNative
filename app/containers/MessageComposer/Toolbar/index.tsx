import React, { ReactElement, useContext } from 'react';

import { BaseButton } from './BaseButton';
import { MicOrSendButton } from './MicOrSendButton';
import { MessageComposerContext } from '../context';
import { Container } from './Container';
import { EmptySpace } from './EmptySpace';
import { ActionsButton } from './ActionsButton';

export const MessageComposerToolbar = (): ReactElement | null => {
	const { openEmojiKeyboard, closeEmojiKeyboard, showEmojiKeyboard, showEmojiSearchbar } = useContext(MessageComposerContext);

	if (showEmojiSearchbar) {
		return null;
	}

	if (showEmojiKeyboard) {
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
	}

	// TODO: Markdown state?

	return (
		<Container>
			<ActionsButton />
			<BaseButton
				onPress={() => openEmojiKeyboard()}
				testID='message-composer-open-emoji'
				accessibilityLabel='Open_emoji_selector'
				icon='emoji'
			/>
			<BaseButton onPress={() => alert('tbd')} testID='TBD' accessibilityLabel='TBD' icon='text-format' />
			<BaseButton onPress={() => alert('tbd')} testID='TBD' accessibilityLabel='TBD' icon='mention' />
			<EmptySpace />
			<MicOrSendButton />
		</Container>
	);
};
