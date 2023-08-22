import React, { ReactElement, useContext } from 'react';

import { MicOrSendButton, ActionsButton, BaseButton } from '..';
import { MessageComposerContext } from '../../context';
import { Container } from './Container';
import { EmptySpace } from './EmptySpace';
import { Gap } from '../Gap';
import { CancelEdit } from '../CancelEdit';

export const Default = (): ReactElement | null => {
	const { openEmojiKeyboard, setMarkdownToolbar } = useContext(MessageComposerContext);

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
			<BaseButton
				onPress={() => setMarkdownToolbar(true)}
				testID='message-composer-open-markdown'
				accessibilityLabel='TBD'
				icon='text-format'
			/>
			<Gap />
			<BaseButton onPress={() => alert('tbd')} testID='message-composer-mention' accessibilityLabel='TBD' icon='mention' />
			<EmptySpace />
			<CancelEdit />
			<MicOrSendButton />
		</Container>
	);
};
