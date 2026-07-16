import { type ReactElement } from 'react';

import { type TComposerExternalState } from '../definitions';
import { ComposerProvider } from '../stores/ComposerStore';
import { type TMessageActionStore, MessageActionProvider } from '../../../containers/message/stores/MessageActionStore';

type IRoomProvidersProps = TComposerExternalState & {
	store: TMessageActionStore;
	children: ReactElement;
};

export const RoomProviders = (props: IRoomProvidersProps): ReactElement => {
	'use memo';

	const { store, children, ...composer } = props;

	return (
		<MessageActionProvider store={store}>
			<ComposerProvider {...composer}>{children}</ComposerProvider>
		</MessageActionProvider>
	);
};
