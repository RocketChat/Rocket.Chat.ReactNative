import { type ReactElement } from 'react';

import { type TComposerExternalState, ComposerProvider } from '../../../containers/MessageComposer/ComposerStore';
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
	room,
	roomUpdate,
	sharing,
	editCancel,
	editRequest,
	onRemoveQuoteMessage,
	onSendMessage
}: IRoomProvidersProps): ReactElement => (
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
			onSendMessage={onSendMessage}>
			{children}
		</ComposerProvider>
	</MessageActionProvider>
);
