import React, { type ReactElement, forwardRef } from 'react';

import { MessageComposerProvider } from './context';
import type { IMessageComposerContainerProps, IMessageComposerRef } from './interfaces';
import { MessageComposer } from './MessageComposer';

export const MessageComposerContainer = forwardRef<IMessageComposerRef, IMessageComposerContainerProps>(
	({ children }, ref): ReactElement => (
		<MessageComposerProvider>
			<MessageComposer forwardedRef={ref}>{children}</MessageComposer>
		</MessageComposerProvider>
	)
);
