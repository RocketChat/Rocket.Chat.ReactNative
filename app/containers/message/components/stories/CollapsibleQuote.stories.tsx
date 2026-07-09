import { type ReactNode } from 'react';
import { View } from 'react-native';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../definitions';
import { MessageRoomProvider } from '../../stores/MessageRoomStore';
import { MessageProvider } from '../../stores/MessageStore';
import CollapsibleQuote from '../Attachments/CollapsibleQuote';

const store = createMockedStore();

const item = {
	id: 'msg-id',
	msg: '',
	u: { _id: 'author-id', username: 'rocket.cat' },
	autoTranslate: false
} as unknown as TAnyMessageModel;

const StoryWrapper = ({ children }: { children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider user={{ username: 'Marcos' }}>
			<MessageProvider item={item}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

const testAttachment = {
	ts: '1970-01-01T00:00:00.000Z',
	title: 'Engineering (9 today)',
	fields: [
		{
			title: 'Out Today:\n',
			value:
				'Ricardo Mellu, 1 day, until Fri Mar 11\nLoma, 1 day, until Fri Mar 11\nAnitta, 3 hours\nDiego Carlitos, 19 days, until Fri Mar 11\nGabriel Vasconcelos, 5 days, until Fri Mar 11\nJorge Leite, 1 day, until Fri Mar 11\nKevin Aleman, 1 day, until Fri Mar 11\nPierre, 1 day, until Fri Mar 11\nTiago Evangelista Pinto, 1 day, until Fri Mar 11'
		}
	],
	attachments: [],
	collapsed: true
};

export default {
	title: 'CollapsibleQuote'
};

export const Item = () => (
	<StoryWrapper>
		<View style={{ padding: 10 }}>
			<CollapsibleQuote attachment={testAttachment} />
		</View>
	</StoryWrapper>
);
