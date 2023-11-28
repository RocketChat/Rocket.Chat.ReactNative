import React, { ReactElement } from 'react';
import { AnimatePresence, MotiView } from 'moti';

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

	// if (showMarkdownToolbar) {
	// 	return <Markdown />;
	// }

	// return <Default />;

	return (
		<AnimatePresence exitBeforeEnter>
			{showMarkdownToolbar && (
				<MotiView
					from={{
						opacity: 0,
						transform: [{ translateY: 10 }]
					}}
					animate={{
						opacity: 1,
						transform: [{ translateY: 0 }]
					}}
					transition={{
						type: 'timing',
						duration: 100
					}}
					exit={{
						opacity: 0
					}}
					key='a'
				>
					<Markdown />
				</MotiView>
			)}
			{!showMarkdownToolbar && (
				<MotiView
					from={{
						opacity: 0,
						transform: [{ translateY: 10 }]
					}}
					animate={{
						opacity: 1,
						transform: [{ translateY: 0 }]
					}}
					transition={{
						type: 'timing',
						duration: 100
					}}
					exit={{
						opacity: 0
					}}
					key='b'
				>
					<Default />
				</MotiView>
			)}
		</AnimatePresence>
	);
};
