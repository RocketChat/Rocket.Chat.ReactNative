import { type ReactElement } from 'react';

import { ComposerProvider, type ComposerState } from './stores/ComposerStore';
import { type TMessageActionStore, MessageActionProvider } from '../../containers/message/stores/MessageActionStore';

type IRoomProvidersProps = ComposerState & {
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
	isAutocompleteVisible,
	editCancel,
	editRequest,
	onRemoveQuoteMessage,
	onSendMessage,
	setQuotesAndText,
	getText,
	updateAutocompleteVisible
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
				isAutocompleteVisible={isAutocompleteVisible}
				editCancel={editCancel}
				editRequest={editRequest}
				onRemoveQuoteMessage={onRemoveQuoteMessage}
				onSendMessage={onSendMessage}
				setQuotesAndText={setQuotesAndText}
				getText={getText}
				updateAutocompleteVisible={updateAutocompleteVisible}>
				{children}
			</ComposerProvider>
		</MessageActionProvider>
	);
};
