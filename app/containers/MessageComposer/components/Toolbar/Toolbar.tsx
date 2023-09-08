import React, { ReactElement } from 'react';

import { useFocused, useShowEmojiKeyboard, useShowEmojiSearchbar, useShowMarkdownToolbar } from '../../context';
import { Markdown } from './Markdown';
import { Default } from './Default';
import { EmojiKeyboard } from './EmojiKeyboard';

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

	if (showMarkdownToolbar) {
		return <Markdown />;
	}

	return <Default />;
};
