/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions */
import React from 'react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { storiesOf } from '@storybook/react-native';

import RoomItem from './RoomItem';
import Message from './Message';
import UiKitMessage from './UiKitMessage';
import UiKitModal from './UiKitModal';
import Markdown from './Markdown';
// import RoomViewHeader from './RoomViewHeader';

// Change here to see themed storybook
const theme = 'light';

const reducers = combineReducers({
	settings: () => ({}),
	login: () => ({
		user: {
			username: 'diego.mello'
		}
	}),
	meteor: () => ({ connected: true }),
	activeUsers: () => ({ abc: { status: 'online', statusText: 'dog' } })
});
const store = createStore(reducers);

storiesOf('RoomItem', module)
	.addDecorator(story => <Provider store={store}>{story()}</Provider>)
	.add('list roomitem', () => <RoomItem theme={theme} />);
storiesOf('Message', module)
	.add('list message', () => <Message theme={theme} />);

storiesOf('UiKitMessage', module)
	.add('list uikitmessage', () => <UiKitMessage theme={theme} />);
storiesOf('UiKitModal', module)
	.add('list UiKitModal', () => <UiKitModal theme={theme} />);
storiesOf('Markdown', module)
	.add('list Markdown', () => <Markdown theme={theme} />);

// FIXME: I couldn't make these pass on jest :(
// storiesOf('RoomViewHeader', module)
// 	.add('list', () => <RoomViewHeader theme='black' />);
