import { type ReactElement } from 'react';

import { RoomContext, type IRoomContext } from './context';
import { type InteractionStore, InteractionStoreContext } from './InteractionStore';

type IRoomProvidersProps = IRoomContext & {
	store: InteractionStore;
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
	'use memo';

	return (
		<InteractionStoreContext.Provider value={store}>
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
		</InteractionStoreContext.Provider>
	);
};
