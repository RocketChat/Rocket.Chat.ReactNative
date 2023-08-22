import React, { ReactElement, useContext } from 'react';

import { MessageComposerContext } from '../../context';
import { Markdown } from './Markdown';
import { Default } from './Default';
import { EmojiKeyboard } from './EmojiKeyboard';

export const Toolbar = (): ReactElement | null => {
	const { focused, showEmojiKeyboard, showEmojiSearchbar, showMarkdownToolbar } = useContext(MessageComposerContext);

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
