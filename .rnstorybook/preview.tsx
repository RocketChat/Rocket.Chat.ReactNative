import React from 'react';
import type { Preview } from '@storybook/react';
import { Provider } from 'react-redux';

import { themes } from '../app/lib/constants/colors';
import MessageContext from '../app/containers/message/Context';
import { selectServerRequest } from '../app/actions/server';
import { mockedStore as store } from '../app/reducers/mockedStore';
import { setUser } from '../app/actions/login';
import { initStore } from '../app/lib/store/auxStore';

initStore(store);

const baseUrl = 'https://open.rocket.chat';
store.dispatch(selectServerRequest(baseUrl, '7.0.0'));
store.dispatch(setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat' }));

const preview: Preview = {
	decorators: [
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
						threadBadgeColor: themes.light.badgeBackgroundLevel1
					}}>
					<Story />
				</MessageContext.Provider>
			</Provider>
		)
	]
};

export default preview;
