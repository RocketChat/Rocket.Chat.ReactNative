/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions */
import React from 'react';
import { createStore, combineReducers } from 'redux';
import { storiesOf } from '@storybook/react-native';

import './RoomItem';
import './List';
import './ServerItem';
import './Message';
import './UiKitMessage';
import './UiKitModal';
import Markdown from './Markdown';
import './HeaderButtons';
import './UnreadBadge';
import '../../app/views/ThreadMessagesView/Item.stories.js';
import './Avatar';
// import RoomViewHeader from './RoomViewHeader';

// Change here to see themed storybook
export const theme = 'light';

const reducers = combineReducers({
	settings: () => ({}),
	login: () => ({
		user: {
			username: 'diego.mello'
		}
	}),
	server: () => ({
		server: 'https://open.rocket.chat',
		version: '3.7.0'
	}),
	share: () => ({
		server: 'https://open.rocket.chat',
		version: '3.7.0',
		settings: {}
	}),
	meteor: () => ({ connected: true }),
	activeUsers: () => ({ abc: { status: 'online', statusText: 'dog' } })
});
export const store = createStore(reducers);

// storiesOf('UiKitMessage', module)
// 	.addDecorator(messageDecorator)
// 	.add('list uikitmessage', () => <UiKitMessage theme={theme} />);
// storiesOf('UiKitModal', module)
// 	.addDecorator(messageDecorator)
// 	.add('list UiKitModal', () => <UiKitModal theme={theme} />);
storiesOf('Markdown', module)
	.add('list Markdown', () => <Markdown theme={theme} />);
// storiesOf('Avatar', module)
// 	.add('list Avatar', () => <Avatar theme={theme} />);

// FIXME: I couldn't make these pass on jest :(
// storiesOf('RoomViewHeader', module)
// 	.add('list', () => <RoomViewHeader theme='black' />);
