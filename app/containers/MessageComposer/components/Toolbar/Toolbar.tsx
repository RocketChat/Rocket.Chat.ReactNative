import React, { ReactElement, useContext } from 'react';

import { MicOrSendButton, ActionsButton, BaseButton } from '..';
import { MessageComposerContext } from '../../context';
import { Container } from './Container';
import { EmptySpace } from './EmptySpace';
import { Gap } from '../Gap';
import { CancelEdit } from '../CancelEdit';

export const Toolbar = (): ReactElement | null => {
	const { openEmojiKeyboard, closeEmojiKeyboard, focused, showEmojiKeyboard, showEmojiSearchbar } =
		useContext(MessageComposerContext);

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

	if (!focused) {
		return null;
	}

	// TODO: Markdown state?

	return (
		<Container>
			<ActionsButton />
			<Gap />
			<BaseButton
				onPress={() => openEmojiKeyboard()}
				testID='message-composer-open-emoji'
				accessibilityLabel='Open_emoji_selector'
				icon='emoji'
			/>
			<Gap />
			<BaseButton onPress={() => alert('tbd')} testID='message-composer-markdown' accessibilityLabel='TBD' icon='text-format' />
			<Gap />
			<BaseButton onPress={() => alert('tbd')} testID='message-composer-mention' accessibilityLabel='TBD' icon='mention' />
			<EmptySpace />
			<CancelEdit />
			<MicOrSendButton />
		</Container>
	);
};
