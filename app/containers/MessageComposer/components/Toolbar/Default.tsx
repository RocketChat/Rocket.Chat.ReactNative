import React, { ReactElement } from 'react';

import { ActionsButton, BaseButton } from '..';
import { useMessageComposerApi } from '../../context';
import { Gap } from '../Gap';
import { emitter } from '../../../../lib/methods/helpers/emitter';
import { useRoomContext } from '../../../../views/RoomView/context';

export const Default = (): ReactElement | null => {
	const { sharing } = useRoomContext();
	const { openEmojiKeyboard, setMarkdownToolbar } = useMessageComposerApi();

	return (
		<>
			{sharing ? null : (
				<>
					<ActionsButton />
					<Gap />
				</>
			)}
			<BaseButton
				onPress={openEmojiKeyboard}
				testID='message-composer-open-emoji'
				accessibilityLabel='Open_emoji_selector'
				icon='emoji'
			/>
			<Gap />
			<BaseButton
				onPress={() => setMarkdownToolbar(true)}
				testID='message-composer-open-markdown'
				accessibilityLabel='Open_markdown_tools'
				icon='text-format'
			/>
			<Gap />
			<BaseButton
				onPress={() => emitter.emit('toolbarMention')}
				testID='message-composer-mention'
				accessibilityLabel='Open_mention_autocomplete'
				icon='mention'
			/>
		</>
	);
};
