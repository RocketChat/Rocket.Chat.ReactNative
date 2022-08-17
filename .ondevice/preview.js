import React from 'react';
import { Provider } from 'react-redux';

import { mockedStore as store } from '../app/reducers/mockedStore';

export const decorators = [
	Story => (
		<Provider store={store}>
			<Story />
		</Provider>
	)
];
