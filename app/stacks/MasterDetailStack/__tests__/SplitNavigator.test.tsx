import { CommonActions, createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
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
