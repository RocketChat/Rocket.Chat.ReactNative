import React, { ReactElement, useContext } from 'react';

import { BaseButton } from './BaseButton';
import { MicOrSendButton } from './MicOrSendButton';
import { MessageComposerContext } from '../context';
import { Container } from './Container';
import { EmptySpace } from './EmptySpace';

export const MessageComposerToolbar = (): ReactElement => {
	const { openEmojiKeyboard, closeEmojiKeyboard, showEmojiKeyboard } = useContext(MessageComposerContext);

	if (showEmojiKeyboard) {
		return (
			<Container>
				<BaseButton onPress={() => alert('tbd')} testID='messagebox-cancel-editing' accessibilityLabel='TBD' icon='add' />
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
	return (
		<Container>
			<BaseButton onPress={() => alert('tbd')} testID='messagebox-cancel-editing' accessibilityLabel='TBD' icon='add' />
			<BaseButton onPress={() => openEmojiKeyboard()} testID='messagebox-cancel-editing' accessibilityLabel='TBD' icon='emoji' />
			<BaseButton onPress={() => alert('tbd')} testID='messagebox-cancel-editing' accessibilityLabel='TBD' icon='add' />
			<BaseButton onPress={() => alert('tbd')} testID='messagebox-cancel-editing' accessibilityLabel='TBD' icon='add' />
			<EmptySpace />
			<MicOrSendButton />
		</Container>
	);
};
