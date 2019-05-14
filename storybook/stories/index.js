/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions */
import React from 'react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { storiesOf } from '@storybook/react-native';

import RoomItem from './RoomItem';
import Avatar from './Avatar';
import Message from './Message';
// import RoomViewHeader from './RoomViewHeader';

const reducers = combineReducers({
	settings: () => ({}),
	login: () => ({
		user: {
			username: 'diego.mello'
		}
	}),
	meteor: () => ({ connected: true })
});
const store = createStore(reducers);

storiesOf('Avatar', module)
	.addDecorator(story => <Provider store={store}>{story()}</Provider>)
	.add('avatar', () => Avatar);
storiesOf('RoomItem', module)
	.addDecorator(story => <Provider store={store}>{story()}</Provider>)
	.add('list', () => RoomItem);
storiesOf('Message', module)
	.add('list', () => Message);
// FIXME: I couldn't make these pass on jest :(
// storiesOf('RoomViewHeader', module)
// 	.add('list', () => RoomViewHeader);
