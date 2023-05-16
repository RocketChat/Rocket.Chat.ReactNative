import React, { ReactElement, useContext } from 'react';
import { View } from 'react-native';

import { BaseButton } from './BaseButton';
import { MicOrSendButton } from './MicOrSendButton';
import { MessageComposerContext } from '../context';
import { Container } from './Container';

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
				<View style={{ flex: 1 }} />
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
			<View style={{ flex: 1 }} />
			<MicOrSendButton />
		</Container>
	);
};
