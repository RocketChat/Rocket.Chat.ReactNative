import React, { type ReactElement, forwardRef } from 'react';

import { MessageComposerProvider } from './context';
import { type IMessageComposerContainerProps, type IMessageComposerRef } from './interfaces';
import { MessageComposer } from './MessageComposer';
import { EmojiKeyboardProvider } from './hooks/useEmojiKeyboard';

export const MessageComposerContainer = forwardRef<IMessageComposerRef, IMessageComposerContainerProps>(
	({ children }, ref): ReactElement => {
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
