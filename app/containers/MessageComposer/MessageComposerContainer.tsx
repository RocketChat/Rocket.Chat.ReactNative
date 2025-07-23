import React, { ReactElement, forwardRef } from 'react';

import { MessageComposerProvider } from './context';
import { IMessageComposerContainerProps, IMessageComposerRef } from './interfaces';
import { MessageComposer } from './MessageComposer';
import { EmojiKeyboardProvider } from './hooks/useEmojiKeyboard';
import { TimestampPickerProvider } from './hooks/useTimestampPicker';

export const MessageComposerContainer = forwardRef<IMessageComposerRef, IMessageComposerContainerProps>(
	({ children }, ref): ReactElement => (
		<MessageComposerProvider>
			<EmojiKeyboardProvider>
				<TimestampPickerProvider>
					<MessageComposer forwardedRef={ref}>{children}</MessageComposer>
				</TimestampPickerProvider>
			</EmojiKeyboardProvider>
		</MessageComposerProvider>
	)
);
