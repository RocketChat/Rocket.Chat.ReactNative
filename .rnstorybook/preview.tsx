import React from 'react';
import type { Preview } from '@storybook/react';
import { Provider } from 'react-redux';

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
				<Story />
			</Provider>
		)
	]
};

export default preview;
