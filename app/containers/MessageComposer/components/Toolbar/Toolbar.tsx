import React, { ReactElement } from 'react';

import { useFocused, useShowMarkdownToolbar } from '../../context';
import { Markdown } from './Markdown';
import { Default } from './Default';
import { EmojiKeyboard } from './EmojiKeyboard';
import { Container } from './Container';
import { MicOrSendButton } from '../Buttons';
import { EmptySpace } from './EmptySpace';
import { CancelEdit } from '../CancelEdit';
import { useEmojiKeyboard } from '../../hooks/useEmojiKeyboard';

export const Toolbar = (): ReactElement | null => {
	const focused = useFocused();
	const { showEmojiKeyboard, showEmojiSearchbar } = useEmojiKeyboard();
	const showMarkdownToolbar = useShowMarkdownToolbar();

	if (showEmojiSearchbar) {
		return null;
	}

	if (showEmojiKeyboard) {
		return <EmojiKeyboard />;
	}

	if (!focused) {
		return null;
	}

	return (
		<Container>
			{showMarkdownToolbar ? <Markdown /> : <Default />}
			<EmptySpace />
			<CancelEdit />
			<MicOrSendButton />
		</Container>
	);
};
