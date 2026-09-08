import { type ReactElement } from 'react';

import { type TComposerExternalState } from '../definitions';
import { ComposerProvider } from '../stores/ComposerStore';
import { type TMessageActionStore, MessageActionProvider } from '../../../containers/message/stores/MessageActionStore';

type IRoomProvidersProps = TComposerExternalState & {
	store: TMessageActionStore;
	children: ReactElement;
};

export const RoomProviders = ({
	store,
	children,
	rid,
	t,
	tmid,
	roomRead,
	sharing,
	editCancel,
	editRequest,
	onRemoveQuoteMessage,
	onSendMessage,
	setQuotesAndText,
	getText
}: IRoomProvidersProps): ReactElement => (
	<MessageActionProvider store={store}>
		<ComposerProvider
			rid={rid}
			t={t}
			tmid={tmid}
			roomRead={roomRead}
			sharing={sharing}
			editCancel={editCancel}
			editRequest={editRequest}
			onRemoveQuoteMessage={onRemoveQuoteMessage}
			onSendMessage={onSendMessage}
			setQuotesAndText={setQuotesAndText}
			getText={getText}>
			{children}
		</ComposerProvider>
	</MessageActionProvider>
);
