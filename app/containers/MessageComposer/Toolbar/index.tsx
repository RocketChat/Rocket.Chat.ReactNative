import React, { ReactElement, useContext } from 'react';

import { BaseButton } from './BaseButton';
import { MicOrSendButton } from './MicOrSendButton';
import { MessageComposerContext } from '../context';
import { Container } from './Container';
import { EmptySpace } from './EmptySpace';
import { ActionsButton } from './ActionsButton';

export const MessageComposerToolbar = (): ReactElement => {
	const { openEmojiKeyboard, closeEmojiKeyboard, showEmojiKeyboard } = useContext(MessageComposerContext);

	if (showEmojiKeyboard) {
		return (
			<Container>
				<ActionsButton />
				<BaseButton
					onPress={() => closeEmojiKeyboard()}
					testID='messagebox-cancel-editing'
					accessibilityLabel='TBD'
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
			<BaseButton onPress={() => openEmojiKeyboard()} testID='messagebox-cancel-editing' accessibilityLabel='TBD' icon='emoji' />
			<BaseButton onPress={() => alert('tbd')} testID='messagebox-cancel-editing' accessibilityLabel='TBD' icon='text-format' />
			<BaseButton onPress={() => alert('tbd')} testID='messagebox-cancel-editing' accessibilityLabel='TBD' icon='mention' />
			<EmptySpace />
			<MicOrSendButton />
		</Container>
	);
};
