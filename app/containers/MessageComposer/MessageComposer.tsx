import React, { ReactElement, forwardRef } from 'react';

import { MessageComposerContextProps, MessageComposerProvider } from './context';
import { IMessageComposerProps, IMessageComposerRef } from './interfaces';
import { MessageComposerInner } from './MessageComposerInner';

export const MessageComposer = forwardRef<IMessageComposerRef, IMessageComposerProps>(
	({ onSendMessage, rid, tmid, sharing = false, editing = false, message, editCancel, editRequest }, ref): ReactElement => (
		<MessageComposerContextProps.Provider
			value={{
				rid,
				tmid,
				editing,
				sharing,
				message,
				editCancel,
				editRequest,
				onSendMessage
			}}
		>
			<MessageComposerProvider>
				<MessageComposerInner forwardedRef={ref} />
			</MessageComposerProvider>
		</MessageComposerContextProps.Provider>
	)
);
