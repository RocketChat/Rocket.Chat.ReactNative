import { forwardRef, type ReactElement } from 'react';

import { type IMessageComposerContainerProps, type IMessageComposerRef } from './interfaces';
import { MessageComposer } from './MessageComposer';
import { EmojiKeyboardProvider } from './hooks/useEmojiKeyboard';
import { ComposerAttachments } from './components/Attachments/ComposerAttachments';
import { ComposerStoreProvider } from './store';

export const MessageComposerContainer = forwardRef<IMessageComposerRef, IMessageComposerContainerProps>(
	({ children = <ComposerAttachments />, render, tmid, sharing, ...callbacks }, ref): ReactElement => {
		const composer = (
			<EmojiKeyboardProvider>
				<MessageComposer forwardedRef={ref}>{children}</MessageComposer>
			</EmojiKeyboardProvider>
		);

		return (
			<ComposerStoreProvider tmid={tmid} sharing={sharing} {...callbacks}>
				{render ? render(composer) : composer}
			</ComposerStoreProvider>
		);
	}
);
