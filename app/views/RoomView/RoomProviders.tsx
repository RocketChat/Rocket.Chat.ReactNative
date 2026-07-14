import { type ReactElement } from 'react';

import { type TComposerExternalState } from './definitions';
import { ComposerProvider } from './stores/ComposerStore';
import { type TMessageActionStore, MessageActionProvider } from '../../containers/message/stores/MessageActionStore';

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
	room,
	roomUpdate,
	sharing,
	editCancel,
	editRequest,
	onRemoveQuoteMessage,
	onSendMessage,
	setQuotesAndText,
	getText
}: IRoomProvidersProps): ReactElement => {
	'use memo';

	return (
		<MessageActionProvider store={store}>
			<ComposerProvider
				rid={rid}
				t={t}
				tmid={tmid}
				room={room}
				roomUpdate={roomUpdate}
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
};
