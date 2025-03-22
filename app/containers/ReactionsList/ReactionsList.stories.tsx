import React from 'react';
import { View } from 'react-native';

import { TGetCustomEmoji, ICustomEmoji } from '../../definitions';
import ReactionsList from '.';
import { mockedStore as store } from '../../reducers/mockedStore';
import { updateSettings } from '../../actions/settings';

const getCustomEmoji: TGetCustomEmoji = content => {
	const customEmoji = {
		marioparty: { name: content, extension: 'gif' },
		react_rocket: { name: content, extension: 'png' },
		nyan_rocket: { name: content, extension: 'png' }
	}[content] as ICustomEmoji;
	return customEmoji;
};

const reactions = [
	{
		emoji: ':marioparty:',
		_id: 'marioparty',
		usernames: ['rocket.cat', 'diego.mello'],
		names: ['Rocket Cat', 'Diego Mello']
	},
	{
		emoji: ':react_rocket:',
		_id: 'react_rocket',
		usernames: ['rocket.cat', 'diego.mello'],
		names: ['Rocket Cat', 'Diego Mello']
	},
	{
		emoji: ':nyan_rocket:',
		_id: 'nyan_rocket',
		usernames: ['rocket.cat'],
		names: ['Rocket Cat']
	},
	{
		emoji: ':grinning:',
		_id: 'grinning',
		usernames: ['diego.mello'],
		names: ['Diego Mello']
	},
	{
		emoji: ':tada:',
		_id: 'tada',
		usernames: ['diego.mello'],
		names: ['Diego Mello']
	}
];

export const ReactionsListStory = () => {
	store.dispatch(updateSettings('UI_Use_Real_Name', false));
	return (
		<View style={{ paddingVertical: 10, flex: 1 }}>
			<ReactionsList getCustomEmoji={getCustomEmoji} reactions={reactions} />
		</View>
	);
};

export const ReactionsListFullName = () => {
	store.dispatch(updateSettings('UI_Use_Real_Name', true));
	return (
		<View style={{ paddingVertical: 10, flex: 1 }}>
			<ReactionsList getCustomEmoji={getCustomEmoji} reactions={reactions} />
		</View>
	);
};

export default {
	title: 'ReactionsList'
};
