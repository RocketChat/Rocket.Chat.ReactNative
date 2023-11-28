import React, { ReactElement } from 'react';
import { AnimatePresence } from 'moti';

import { useFocused, useShowEmojiKeyboard, useShowEmojiSearchbar, useShowMarkdownToolbar } from '../../context';
import { Markdown } from './Markdown';
import { Default } from './Default';
import { EmojiKeyboard } from './EmojiKeyboard';
import { Container } from './Container';
import { MicOrSendButton } from '../Buttons';
import { EmptySpace } from './EmptySpace';
import { CancelEdit } from '../CancelEdit';

export const Toolbar = (): ReactElement | null => {
	console.count('[MessageComposer] Toolbar');
	const focused = useFocused();
	const showEmojiKeyboard = useShowEmojiKeyboard();
	const showEmojiSearchbar = useShowEmojiSearchbar();
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
			<AnimatePresence exitBeforeEnter>{showMarkdownToolbar ? <Markdown /> : <Default />}</AnimatePresence>
			<EmptySpace />
			<CancelEdit />
			<MicOrSendButton />
		</Container>
	);
};
