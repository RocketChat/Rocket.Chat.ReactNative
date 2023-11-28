import React, { ReactElement } from 'react';

import { ActionsButton, BaseButton } from '..';
import { useMessageComposerApi } from '../../context';
import { Gap } from '../Gap';
import { emitter } from '../../emitter';
import { AnimatedToolbar } from './AnimatedToolbar';

export const Default = (): ReactElement | null => {
	const { openEmojiKeyboard, setMarkdownToolbar } = useMessageComposerApi();

	return (
		<AnimatedToolbar key='default'>
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
			<BaseButton
				onPress={() => emitter.emit('toolbarMention')}
				testID='message-composer-mention'
				accessibilityLabel='TBD'
				icon='mention'
			/>
		</AnimatedToolbar>
	);
};
