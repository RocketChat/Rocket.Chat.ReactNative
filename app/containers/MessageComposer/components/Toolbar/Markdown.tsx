import React, { ReactElement, useContext } from 'react';

import { MicOrSendButton, BaseButton } from '..';
import { MessageComposerContext } from '../../context';
import { Container } from './Container';
import { EmptySpace } from './EmptySpace';
import { Gap } from '../Gap';
import { CancelEdit } from '../CancelEdit';
import { TMarkdownStyle } from '../../interfaces';
import { emitter } from '../../emitter';

export const Markdown = (): ReactElement => {
	const { setMarkdownToolbar } = useContext(MessageComposerContext);

	const onPress = (style: TMarkdownStyle) => emitter.emit('addMarkdown', { style });

	// TODO: animate enter/leave
	return (
		<Container>
			<BaseButton
				onPress={() => setMarkdownToolbar(false)}
				testID='message-composer-close-markdown'
				accessibilityLabel='TBD'
				icon='close'
			/>
			<Gap />
			<BaseButton onPress={() => onPress('bold')} testID='message-composer-bold' accessibilityLabel='TBD' icon='bold' />
			<Gap />
			<BaseButton onPress={() => onPress('italic')} testID='message-composer-italic' accessibilityLabel='TBD' icon='italic' />
			<Gap />
			<BaseButton onPress={() => onPress('strike')} testID='message-composer-strike' accessibilityLabel='TBD' icon='strike' />
			<Gap />
			<BaseButton onPress={() => onPress('code')} testID='message-composer-code' accessibilityLabel='TBD' icon='code' />
			<Gap />
			<BaseButton
				onPress={() => onPress('code-block')}
				testID='message-composer-code-block'
				accessibilityLabel='TBD'
				icon='code-block'
			/>
			<EmptySpace />
			<CancelEdit />
			<MicOrSendButton />
		</Container>
	);
};
