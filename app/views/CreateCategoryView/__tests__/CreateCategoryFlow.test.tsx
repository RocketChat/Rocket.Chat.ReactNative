import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { setEnterpriseModules } from '~/actions/enterpriseModules';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { createMockedStore } from '~/reducers/mockedStore';
import CategoryRoomsView from '../CategoryRoomsView';
import ConfirmCategoryView from '../ConfirmCategoryView';
import { startCategoryDraft } from '../hooks/useCategoryDraftStore';
import CreateCategoryView from '..';

jest.mock('@react-navigation/native', () => jest.requireActual('@react-navigation/native'));

jest.mock('../hooks/useCategoryRoomCandidates', () => ({
	useCategoryRoomCandidates: () => [
		{ rid: 'general', title: 'general', avatar: 'general', t: 'c' },
		{ rid: 'random', title: 'random', avatar: 'random', t: 'c' }
	]
}));

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

const renderFlow = () => {
	startCategoryDraft();
	const store = createMockedStore();
	store.dispatch(selectServerSuccess({ server: 'https://a.rocket.chat', version: '8.9.0', name: 'A' }));
	store.dispatch(setEnterpriseModules([], true));
	store.dispatch(setUser({ id: 'user-a', sidebarCategories: [] }));
	render(
		<Provider store={store}>
			<NavigationContainer ref={navigationRef}>
				<Stack.Navigator>
					<Stack.Screen name='CreateCategoryView' component={CreateCategoryView} />
					<Stack.Screen name='CategoryRoomsView' component={CategoryRoomsView} />
					<Stack.Screen name='ConfirmCategoryView' component={ConfirmCategoryView} />
				</Stack.Navigator>
			</NavigationContainer>
		</Provider>
	);
};

const goBack = () => act(() => navigationRef.goBack());

const confirmView = () => within(screen.getByTestId('confirm-category-view'));

it('keeps the picked rooms when going back to the name and forward again', () => {
	renderFlow();

	fireEvent.changeText(screen.getByTestId('create-category-name'), 'Work');
	fireEvent.press(screen.getByTestId('create-category-view-next'));
	fireEvent.press(screen.getByLabelText('general Unselected'));
	goBack();
	fireEvent.press(screen.getByTestId('create-category-view-next'));

	expect(screen.getByLabelText('general Selected')).toBeOnTheScreen();
});

it('keeps the confirm screen edits when going back', () => {
	renderFlow();

	fireEvent.changeText(screen.getByTestId('create-category-name'), 'Work');
	fireEvent.press(screen.getByTestId('create-category-view-next'));
	fireEvent.press(screen.getByLabelText('random Unselected'));
	fireEvent.press(screen.getByTestId('category-rooms-view-next'));
	fireEvent.press(confirmView().getByTestId('create-category-selected-room-random'));
	fireEvent.changeText(confirmView().getByTestId('create-category-name'), 'Home');
	goBack();

	expect(screen.getByLabelText('random Unselected')).toBeOnTheScreen();

	goBack();

	expect(screen.getByTestId('create-category-name')).toHaveDisplayValue('Home');
});
