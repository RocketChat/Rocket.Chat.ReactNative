import React, { ReactElement, forwardRef } from 'react';

import { MessageComposerProvider } from './context';
import { IMessageComposerRef } from './interfaces';
import { MessageComposerInner } from './MessageComposerInner';

export const MessageComposer = forwardRef<IMessageComposerRef>(
	(_, ref): ReactElement => (
		<MessageComposerProvider>
			<MessageComposerInner forwardedRef={ref} />
		</MessageComposerProvider>
	)
);
