/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions */

import React from 'react';
import { Provider } from 'react-redux';

import { createStore, combineReducers } from 'redux';


import { storiesOf } from '@storybook/react-native';
// import { action } from '@storybook/addon-actions';
// import { linkTo } from '@storybook/addon-links';

import DirectMessage from './Channels/DirectMessage';
import Avatar from './Avatar';

const reducers = combineReducers({ settings: () => ({}) });
const store = createStore(reducers);

storiesOf('Avatar', module).addDecorator(story => <Provider store={store}>{story()}</Provider>).add('avatar', () => Avatar);
storiesOf('Channel Cell', module).addDecorator(story => <Provider store={store}>{story()}</Provider>).add('Direct Messages', () => DirectMessage);

// storiesOf('Welcome', module).add('to Storybook', () => <Welcome showApp={linkTo('Button')} />);

// storiesOf('Button', module)
// 	.addDecorator(getStory => (
// 		<CenterView>
// 			{getStory()}
// 		</CenterView>
// 	))
// 	.add('with text', () => (
// 		<Button onPress={action('clicked-text')}>
// 			<Text>Hello Button</Text>
// 		</Button>
// 	))
