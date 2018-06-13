import {View} from 'react-native';
import { Provider } from 'react-redux';

import { createStore, combineReducers } from 'redux';

const reducers = combineReducers({login:() => ({user: {}}), settings:() => ({}), meteor: () => ({ connected: true })});
const store = createStore(reducers);

import React from 'react';
import RoomItem from '../app/presentation/RoomItem';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

const date = new Date(2017, 10, 10, 10);

jest.mock('react-native-img-cache', () => { return { CachedImage: 'View' } });

it('renders correctly', () => {
	expect(renderer.create(<Provider store={store}><View><RoomItem type="d" _updatedAt={date} name="name" /></View></Provider>).toJSON()).toMatchSnapshot();
});

it('render unread', () => {
	expect(renderer.create(<Provider store={store}><View><RoomItem type="d" _updatedAt={date} name="name" unread={1} /></View></Provider>).toJSON()).toMatchSnapshot();
});

it('render unread +999', () => {
	expect(renderer.create(<Provider store={store}><View><RoomItem type="d" _updatedAt={date} name="name" unread={1000} /></View></Provider>).toJSON()).toMatchSnapshot();
});

it('render no icon', () => {
	expect(renderer.create(<Provider store={store}><View><RoomItem type="X" _updatedAt={date} name="name" /></View></Provider>).toJSON()).toMatchSnapshot();
});

it('render private group', () => {
	expect(renderer.create(<Provider store={store}><View><RoomItem type="g" _updatedAt={date} name="private-group" /> </View></Provider>).toJSON()).toMatchSnapshot();
});

it('render channel', () => {
	expect(renderer.create(<Provider store={store}><View><RoomItem type="c" _updatedAt={date} name="general" /></View></Provider>).toJSON()).toMatchSnapshot();
});
