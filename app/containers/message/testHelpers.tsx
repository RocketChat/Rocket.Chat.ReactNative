import { type ReactElement, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react-native';

import { type TAnyMessageModel } from '../../definitions';
import { mockedStore } from '../../reducers/mockedStore';
import { MessageProvider } from './MessageStore';
import { MessageRoomProvider, pickMessageRoomState, type MessageRoomState } from './MessageRoomStore';

interface IMessageProvidersOptions {
	item?: TAnyMessageModel;
	previousItem?: TAnyMessageModel;
	context?: Record<string, any>;
	room?: Partial<MessageRoomState>;
	withRedux?: boolean;
}

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
	tree = <MessageRoomProvider {...roomState}>{tree}</MessageRoomProvider>;
	if (withRedux) {
		tree = <Provider store={mockedStore}>{tree}</Provider>;
	}
	return tree as ReactElement;
};

export const renderWithMessageProviders = (ui: ReactElement, options: IMessageProvidersOptions = {}) =>
	render(<MessageProviders {...options}>{ui}</MessageProviders>);
