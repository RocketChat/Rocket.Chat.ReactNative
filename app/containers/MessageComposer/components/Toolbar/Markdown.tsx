import React, { ReactElement } from 'react';

import { BaseButton } from '..';
import { useMessageComposerApi } from '../../context';
import { Gap } from '../Gap';
import { TMarkdownStyle } from '../../interfaces';
import { emitter } from '../../../../lib/methods/helpers/emitter';

export const Markdown = (): ReactElement => {
	const { setMarkdownToolbar } = useMessageComposerApi();

	const onPress = (style: TMarkdownStyle) => emitter.emit('addMarkdown', { style });

	return (
		<>
			<BaseButton
				onPress={() => setMarkdownToolbar(false)}
				testID='message-composer-close-markdown'
				accessibilityLabel='Close'
				icon='close'
			/>
			<Gap />
			<BaseButton onPress={() => onPress('bold')} testID='message-composer-bold' accessibilityLabel='Bold' icon='bold' />
			<Gap />
			<BaseButton onPress={() => onPress('italic')} testID='message-composer-italic' accessibilityLabel='Italic' icon='italic' />
			<Gap />
			<BaseButton
				onPress={() => onPress('strike')}
				testID='message-composer-strike'
				accessibilityLabel='Strikethrough'
				icon='strike'
			/>
			<Gap />
			<BaseButton onPress={() => onPress('code')} testID='message-composer-code' accessibilityLabel='Inline_code' icon='code' />
			<Gap />
			<BaseButton
				onPress={() => onPress('code-block')}
				testID='message-composer-code-block'
				accessibilityLabel='Code_block'
				icon='code-block'
			/>
		</>
	);
};
