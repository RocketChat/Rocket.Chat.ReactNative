import { type ReactElement, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react-native';

import { type TAnyMessageModel } from '../../definitions';
import { mockedStore } from '../../reducers/mockedStore';
import MessageContext, { type IMessageContext } from './Context';
import { MessageProvider } from './MessageStore';
import { MessageRoomProvider, pickMessageRoomState, type MessageRoomState } from './MessageRoomStore';

interface IMessageProvidersOptions {
	item?: TAnyMessageModel;
	previousItem?: TAnyMessageModel;
	context?: Partial<IMessageContext>;
	room?: Partial<MessageRoomState>;
	withRedux?: boolean;
}

// Provider stack every message-subtree test needs during the MessageContext → room-store dual-run:
// Redux → MessageRoomProvider (new) → MessageContext.Provider (legacy, only when `context` given)
// → MessageProvider (per-message store, only when `item` given). `room` defaults to the room-scoped
// slice of `context`, so a single source (`context`) feeds both providers with identical values.
export const MessageProviders = ({
	item,
	previousItem,
	context,
	room,
	withRedux = true,
	children
}: IMessageProvidersOptions & { children: ReactNode }): ReactElement => {
	const roomState = room ?? pickMessageRoomState(context ?? {});

	let tree: ReactNode = children;
	if (item) {
		tree = (
			<MessageProvider item={item} previousItem={previousItem}>
				{tree}
			</MessageProvider>
		);
	}
	if (context !== undefined) {
		tree = <MessageContext.Provider value={context as IMessageContext}>{tree}</MessageContext.Provider>;
	}
	tree = <MessageRoomProvider {...roomState}>{tree}</MessageRoomProvider>;
	if (withRedux) {
		tree = <Provider store={mockedStore}>{tree}</Provider>;
	}
	return tree as ReactElement;
};

export const renderWithMessageProviders = (ui: ReactElement, options: IMessageProvidersOptions = {}) =>
	render(<MessageProviders {...options}>{ui}</MessageProviders>);
