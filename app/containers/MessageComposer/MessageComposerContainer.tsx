import React, { ReactElement, forwardRef } from 'react';

import { MessageComposerProvider } from './context';
import { IMessageComposerContainerProps, IMessageComposerRef } from './interfaces';
import { MessageComposer } from './MessageComposer';
import { EmojiKeyboardProvider } from './hooks/useEmojiKeyboard';

export const MessageComposerContainer = forwardRef<IMessageComposerRef, IMessageComposerContainerProps>(
	({ children }, ref): ReactElement => (
		<MessageComposerProvider>
			<EmojiKeyboardProvider>
				<MessageComposer forwardedRef={ref}>{children}</MessageComposer>
			</EmojiKeyboardProvider>
		</MessageComposerProvider>
	)
);
