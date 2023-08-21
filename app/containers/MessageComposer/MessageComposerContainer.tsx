import React, { ReactElement, forwardRef } from 'react';

import { MessageComposerProvider } from './context';
import { IMessageComposerRef } from './interfaces';
import { MessageComposer } from './MessageComposer';

export const MessageComposerContainer = forwardRef<IMessageComposerRef>(
	(_, ref): ReactElement => (
		<MessageComposerProvider>
			<MessageComposer forwardedRef={ref} />
		</MessageComposerProvider>
	)
);
