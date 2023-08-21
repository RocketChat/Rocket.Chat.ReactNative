import React, { ReactElement, useContext } from 'react';

import { MicOrSendButton, ActionsButton, BaseButton } from '..';
import { MessageComposerContext } from '../../context';
import { Container } from './Container';
import { EmptySpace } from './EmptySpace';
import { Gap } from '../Gap';
import { CancelEdit } from '../CancelEdit';

export const Toolbar = (): ReactElement | null => {
	const {
		openEmojiKeyboard,
		closeEmojiKeyboard,
		setMarkdownToolbar,
		focused,
		showEmojiKeyboard,
		showEmojiSearchbar,
		showMarkdownToolbar
	} = useContext(MessageComposerContext);

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

	if (showMarkdownToolbar) {
		return (
			<Container>
				<BaseButton
					onPress={() => setMarkdownToolbar(false)}
					testID='message-composer-close-markdown'
					accessibilityLabel='TBD'
					icon='close'
				/>
				<Gap />
				<BaseButton onPress={() => openEmojiKeyboard()} testID='message-composer-bold' accessibilityLabel='TBD' icon='bold' />
				<Gap />
				<BaseButton onPress={() => openEmojiKeyboard()} testID='message-composer-italic' accessibilityLabel='TBD' icon='italic' />
				<Gap />
				<BaseButton onPress={() => alert('tbd')} testID='message-composer-strike' accessibilityLabel='TBD' icon='strike' />
				<Gap />
				<BaseButton onPress={() => alert('tbd')} testID='message-composer-code' accessibilityLabel='TBD' icon='code' />
				<Gap />
				<BaseButton
					onPress={() => alert('tbd')}
					testID='message-composer-code-block'
					accessibilityLabel='TBD'
					icon='code-block'
				/>
				<EmptySpace />
				<CancelEdit />
				<MicOrSendButton />
			</Container>
		);
	}

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
