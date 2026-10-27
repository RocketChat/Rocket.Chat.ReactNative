import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { Subject } from 'rxjs';

import { setEnterpriseModules } from '~/actions/enterpriseModules';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { type TSubscriptionModel } from '~/definitions';
import { setRoomsCategory } from '~/lib/services/restApi';
import { initStore } from '~/lib/store/auxStore';
import { createMockedStore } from '~/reducers/mockedStore';
import MoveToCategorySheet from '..';

jest.mock('~/lib/services/restApi', () => ({
	setRoomsCategory: jest.fn(() => Promise.resolve()),
	toggleFavorite: jest.fn(() => Promise.resolve())
}));

const mockSubscriptionRows = new Subject<Partial<TSubscriptionModel>[]>();

jest.mock('~/lib/database', () => ({
	active: {
		get: () => ({
			query: () => ({
				observeWithColumns: () => mockSubscriptionRows
			})
		})
	}
}));

const room = { rid: 'room1', name: 'general', t: 'c', category: 'work', f: false } as unknown as TSubscriptionModel;

const renderSheet = () => {
	const store = createMockedStore();
	initStore(store);
	store.dispatch(selectServerSuccess({ server: 'https://open.rocket.chat', version: '8.9.0', name: 'Open' }));
	store.dispatch(setEnterpriseModules([], true));
	store.dispatch(
		setUser({
			sidebarCategories: [
				{ _id: 'work', name: 'Work' },
				{ _id: 'home', name: 'Home' }
			]
		})
	);
	render(
		<Provider store={store}>
			<MoveToCategorySheet room={room} />
		</Provider>
	);
};

it('moves the room by its current category after another device moved it while the sheet is open', () => {
	renderSheet();

	act(() => {
		mockSubscriptionRows.next([{ rid: 'room1', category: 'home', f: false }]);
	});
	fireEvent.press(screen.getByTestId('move-to-category-work'));

	expect(setRoomsCategory).toHaveBeenCalledWith(['room1'], 'work');
});
