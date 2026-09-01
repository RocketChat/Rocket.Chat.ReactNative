import { type ReactElement } from 'react';

import { RoomContext, type IRoomContext } from './context';
import { type TMessageActionStore, MessageActionProvider } from '../../containers/message/stores/MessageActionStore';

type IRoomProvidersProps = IRoomContext & {
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
	return (
		<MessageActionProvider store={store}>
			<RoomContext.Provider
				value={{
					rid,
					t,
					tmid,
					room,
					sharing,
					isAutocompleteVisible,
					editCancel,
					editRequest,
					onRemoveQuoteMessage,
					onSendMessage,
					setQuotesAndText,
					getText,
					updateAutocompleteVisible
				}}>
				{children}
			</RoomContext.Provider>
		</MessageActionProvider>
	);
};
