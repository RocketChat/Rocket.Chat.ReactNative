import {View} from 'react-native';
import { Provider } from 'react-redux';

import { createStore, combineReducers } from 'redux';

const reducers = combineReducers({login:() => ({user: {}}), settings:() => ({}), meteor: () => ({ connected: true })});
const store = createStore(reducers);

import React from 'react';
import RoomItem from '../app/presentation/RoomItem';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

const date = '2017-10-10T10:00:00Z';
const onPress = () => {};

it('renders correctly', () => {
	expect(renderer.create(<Provider store={store}><View><RoomItem onPress={onPress} type="d" _updatedAt={date} name="name" baseUrl="baseUrl" /></View></Provider>).toJSON()).toMatchSnapshot();
});

it('render unread', () => {
	expect(renderer.create(<Provider store={store}><View><RoomItem onPress={onPress} type="d" _updatedAt={date} name="name" unread={1} /></View></Provider>).toJSON()).toMatchSnapshot();
});

it('render unread +999', () => {
	expect(renderer.create(<Provider store={store}><View><RoomItem onPress={onPress} type="d" _updatedAt={date} name="name" unread={1000} /></View></Provider>).toJSON()).toMatchSnapshot();
});

it('render no icon', () => {
	expect(renderer.create(<Provider store={store}><View><RoomItem onPress={onPress} type="X" _updatedAt={date} name="name" /></View></Provider>).toJSON()).toMatchSnapshot();
});

it('render private group', () => {
	expect(renderer.create(<Provider store={store}><View><RoomItem onPress={onPress} type="g" _updatedAt={date} name="private-group" /> </View></Provider>).toJSON()).toMatchSnapshot();
});

it('render channel', () => {
	expect(renderer.create(<Provider store={store}><View><RoomItem onPress={onPress} type="c" _updatedAt={date} name="general" /></View></Provider>).toJSON()).toMatchSnapshot();
});
