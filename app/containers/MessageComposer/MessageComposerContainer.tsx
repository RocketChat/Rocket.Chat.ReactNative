import { forwardRef, type ReactElement } from 'react';

import { MessageComposerProvider } from './context';
import { type IMessageComposerContainerProps, type IMessageComposerRef } from './interfaces';
import { MessageComposer } from './MessageComposer';
import { EmojiKeyboardProvider } from './hooks/useEmojiKeyboard';
import { ComposerAttachments } from './components/Attachments/ComposerAttachments';

export const MessageComposerContainer = forwardRef<IMessageComposerRef, IMessageComposerContainerProps>(
	({ children = <ComposerAttachments /> }, ref): ReactElement => {
		return (
			<MessageComposerProvider>
				<EmojiKeyboardProvider>
					<MessageComposer forwardedRef={ref}>{children}</MessageComposer>
				</EmojiKeyboardProvider>
			</MessageComposerProvider>
		);
	}
);
