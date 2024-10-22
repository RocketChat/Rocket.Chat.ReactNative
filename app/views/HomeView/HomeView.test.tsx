import React from 'react';
import { cleanup, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { mockedStore as store } from '../../reducers/mockedStore';
import HomeView from './index';

jest.mock('@react-navigation/native', () => {
	return {
		...jest.requireActual('@react-navigation/native'),
		useNavigation: () => ({
			navigate: jest.fn(),
			setOptions: jest.fn()
		})
	};
});

describe('HomeView', () => {
	it('renders', async () => {
		const { getByTestId } = render(
			<Provider store={store}>
				<HomeView />
			</Provider>
		);
		expect(getByTestId('home-view')).toBeTruthy();
	});
});
