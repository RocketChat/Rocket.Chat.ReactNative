import React, { ReactElement } from 'react';
import { KeyboardController } from 'react-native-keyboard-controller';

import { ActionsButton, BaseButton } from '..';
import { useMessageComposerApi } from '../../context';
import { Gap } from '../Gap';
import { emitter } from '../../../../lib/methods/helpers/emitter';
import { useRoomContext } from '../../../../views/RoomView/context';
import { useEmojiKeyboard } from '../../hooks/useEmojiKeyboard';

export const Default = (): ReactElement | null => {
	'use memo';

	const { sharing } = useRoomContext();
	const { setMarkdownToolbar } = useMessageComposerApi();
	const { openEmojiKeyboard } = useEmojiKeyboard();

	const openEmoji = async () => {
		openEmojiKeyboard();
		await KeyboardController.dismiss({ keepFocus: true });
	};

	return (
		<>
			{sharing ? null : (
				<>
					<ActionsButton />
					<Gap />
				</>
			)}
			<BaseButton
				onPress={() => openEmoji()}
				testID='message-composer-open-emoji'
				accessibilityLabel='Emoji_selector'
				icon='emoji'
			/>
			<Gap />
			<BaseButton
				onPress={() => setMarkdownToolbar(true)}
				testID='message-composer-open-markdown'
				accessibilityLabel='Markdown_tools'
				icon='text-format'
			/>
			<Gap />
			<BaseButton
				onPress={() => emitter.emit('toolbarMention')}
				testID='message-composer-mention'
				accessibilityLabel='Mention_user'
				icon='mention'
			/>
		</>
	);
};
