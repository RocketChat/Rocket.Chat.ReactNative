import React from 'react';
import { Provider } from 'react-redux';

import { themes } from '../app/lib/constants';
import MessageContext from '../app/containers/message/Context';
import { selectServerRequest } from '../app/actions/server';
import { mockedStore as store } from '../app/reducers/mockedStore';
import { setUser } from '../app/actions/login';

const baseUrl = 'https://open.rocket.chat';
store.dispatch(selectServerRequest(baseUrl));
store.dispatch(setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat' }));

export const decorators = [
	Story => (
		<Provider store={store}>
			<MessageContext.Provider
				value={{
					user: {
						id: 'y8bd77ptZswPj3EW8',
						username: 'diego.mello',
						token: 'abc'
					},
					baseUrl,
					onPress: () => {},
					onLongPress: () => {},
					reactionInit: () => {},
					onErrorPress: () => {},
					replyBroadcast: () => {},
					onReactionPress: () => {},
					onDiscussionPress: () => {},
					onReactionLongPress: () => {},
					threadBadgeColor: themes.light.tunreadColor
				}}
			>
				<Story />
			</MessageContext.Provider>
		</Provider>
	)
];
