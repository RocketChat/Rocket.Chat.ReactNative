import { forwardRef } from 'react';

import { MessageComposerProvider } from './context';
import type { IMessageComposerContainerProps, IMessageComposerRef } from './interfaces';
import { MessageComposer } from './MessageComposer';
import { EmojiKeyboardProvider } from './hooks/useEmojiKeyboard';

export const MessageComposerContainer = forwardRef<IMessageComposerRef, IMessageComposerContainerProps>(
	function MessageComposerContainer({ children }, ref) {
		'use memo';

		return (
			<MessageComposerProvider>
				<EmojiKeyboardProvider>
					<MessageComposer forwardedRef={ref}>{children}</MessageComposer>
				</EmojiKeyboardProvider>
			</MessageComposerProvider>
		);
	}
);
