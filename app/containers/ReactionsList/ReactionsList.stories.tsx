import React from 'react';
import { View } from 'react-native';

import { TGetCustomEmoji, IEmoji } from '../../definitions';
import ReactionsList from '.';

const getCustomEmoji: TGetCustomEmoji = content => {
	const customEmoji = {
		marioparty: { name: content, extension: 'gif' },
		react_rocket: { name: content, extension: 'png' },
		nyan_rocket: { name: content, extension: 'png' }
	}[content] as IEmoji;
	return customEmoji;
};

const username = 'rocket.cat';
const reactions = [
	{
		emoji: ':marioparty:',
		_id: 'marioparty',
		usernames: ['rocket.cat', 'diego.mello'],
		names: ['Rocket.cat', 'Diego Mello']
	},
	{
		emoji: ':react_rocket:',
		_id: 'react_rocket',
		usernames: ['rocket.cat', 'diego.mello'],
		names: ['Rocket.cat', 'Diego Mello']
	},
	{
		emoji: ':nyan_rocket:',
		_id: 'nyan_rocket',
		usernames: ['rocket.cat'],
		names: ['Rocket.cat']
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

export const ReactionsListStory = () => (
	<View style={{ paddingVertical: 10, flex: 1 }}>
		<ReactionsList getCustomEmoji={getCustomEmoji} reactions={reactions} username={username} />
	</View>
);

export default {
	title: 'ReactionsList'
};
