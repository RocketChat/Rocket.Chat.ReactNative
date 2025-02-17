import { forwardRef } from 'react';

import { MessageComposerProvider } from './context';
import type { IMessageComposerContainerProps, IMessageComposerRef } from './interfaces';
import { MessageComposer } from './MessageComposer';

export const MessageComposerContainer = forwardRef<IMessageComposerRef, IMessageComposerContainerProps>(
	function MessageComposerContainer({ children }, ref) {
		return <MessageComposerProvider>
			<MessageComposer forwardedRef={ref}>{children}</MessageComposer>
		</MessageComposerProvider>
	}
);
