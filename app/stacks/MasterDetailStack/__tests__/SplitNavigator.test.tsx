import { CommonActions, createNavigationContainerRef, NavigationContainer, StackActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { createSplitNavigator } from '../SplitNavigator';

jest.mock('@react-navigation/native', () => jest.requireActual('@react-navigation/native'));

const Split = createSplitNavigator();
const MasterStack = createNativeStackNavigator();
const DetailStack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef<any>();

const RoomsList = ({ navigation }: any) => (
	<Pressable onPress={() => navigation.navigate('CategoryView')}>
		<Text>open category</Text>
	</Pressable>
);
const Category = () => <Text>category</Text>;
const Room = ({ route }: any) => <Text>{`room ${route.params?.rid ?? 'empty'}`}</Text>;

const Master = () => (
	<MasterStack.Navigator>
		<MasterStack.Screen name='RoomsListView' component={RoomsList} />
		<MasterStack.Screen name='CategoryView' component={Category} />
	</MasterStack.Navigator>
);

const Detail = () => (
	<DetailStack.Navigator>
		<DetailStack.Screen name='RoomView' component={Room} />
	</DetailStack.Navigator>
);

const renderSplit = () =>
	render(
		<NavigationContainer ref={navigationRef}>
			<Split.Navigator initialRouteName='ChatsStackNavigator'>
				<Split.Screen name='RoomsListStackNavigator' component={Master} />
				<Split.Screen name='ChatsStackNavigator' component={Detail} />
			</Split.Navigator>
		</NavigationContainer>
	);

it('keeps the detail stack focused after pushing a screen onto the master stack', () => {
	renderSplit();

	fireEvent.press(screen.getByText('open category'));
	act(() =>
		navigationRef.dispatch(state =>
			CommonActions.reset({ ...state, routes: [{ name: 'RoomView', params: { rid: 'general' } }], index: 0 })
		)
	);

	expect(screen.getByText('category')).toBeOnTheScreen();
	expect(screen.getByText('room general')).toBeOnTheScreen();
});

it('goes back on the master stack when the detail stack has nothing to pop', () => {
	renderSplit();

	fireEvent.press(screen.getByText('open category'));
	act(() => navigationRef.goBack());

	expect(screen.getByText('open category')).toBeOnTheScreen();
	expect(screen.queryByText('category')).not.toBeOnTheScreen();
	expect(screen.getByText('room empty')).toBeOnTheScreen();
});

it('cannot go back when neither stack has a screen to pop', () => {
	renderSplit();

	expect(navigationRef.canGoBack()).toBe(false);
});

it('goes back on the detail stack first while it has a screen to pop', () => {
	renderSplit();

	fireEvent.press(screen.getByText('open category'));
	act(() => navigationRef.dispatch(StackActions.push('RoomView', { rid: 'general' })));
	act(() => navigationRef.goBack());

	expect(screen.getByText('category')).toBeOnTheScreen();
	expect(screen.getByText('room empty')).toBeOnTheScreen();
});
