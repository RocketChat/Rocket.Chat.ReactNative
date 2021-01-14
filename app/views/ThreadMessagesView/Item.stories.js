/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types */
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { ScrollView } from 'react-native';
import { combineReducers, createStore } from 'redux';
import { Provider } from 'react-redux';

import Item from './Item';
import * as List from '../../containers/List';
import { themes } from '../../constants/colors';
import { ThemeContext } from '../../theme';

const author = {
	_id: 'userid',
	username: 'rocket.cat',
	name: 'Rocket Cat'
};
const baseUrl = 'https://open.rocket.chat';
const date = new Date(2020, 10, 10, 10);
const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
const defaultItem = {
	msg: 'Message content',
	tcount: 1,
	replies: [1],
	ts: date,
	tlm: date,
	u: author,
	attachments: []
};

const BaseItem = ({ item, ...props }) => (
	<Item
		baseUrl={baseUrl}
		item={{
			...defaultItem,
			...item
		}}
		onPress={() => alert('pressed')}
		{...props}
	/>
);

const listDecorator = story => (
	<ScrollView>
		<List.Separator />
		{story()}
		<List.Separator />
	</ScrollView>
);

const reducers = combineReducers({
	login: () => ({
		user: {
			id: 'abc',
			username: 'rocket.cat',
			name: 'Rocket Cat'
		}
	}),
	server: () => ({
		server: 'https://open.rocket.chat',
		version: '3.7.0'
	}),
	share: () => ({
		server: 'https://open.rocket.chat',
		version: '3.7.0'
	}),
	settings: () => ({
		blockUnauthenticatedAccess: false
	})
});
const store = createStore(reducers);

const stories = storiesOf('Thread Messages.Item', module)
	.addDecorator(listDecorator)
	.addDecorator(story => <Provider store={store}>{story()}</Provider>);

stories.add('content', () => (
	<>
		<BaseItem />
		<List.Separator />
		<BaseItem
			item={{
				msg: longText
			}}
		/>
		<List.Separator />
		<BaseItem
			item={{
				tcount: 1000,
				replies: [...new Array(1000)]
			}}
		/>
		<List.Separator />
		<BaseItem
			item={{
				msg: '',
				attachments: [{ title: 'Attachment title' }]
			}}
		/>
		<List.Separator />
		<BaseItem useRealName />
	</>
));

stories.add('badge', () => (
	<>
		<BaseItem
			badgeColor={themes.light.mentionMeColor}
		/>
		<List.Separator />
		<BaseItem
			badgeColor={themes.light.mentionGroupColor}
		/>
		<List.Separator />
		<BaseItem
			badgeColor={themes.light.tunreadColor}
		/>
		<BaseItem
			item={{
				msg: longText
			}}
			badgeColor={themes.light.tunreadColor}
		/>
	</>
));

const ThemeStory = ({ theme }) => (
	<ThemeContext.Provider
		value={{ theme }}
	>
		<BaseItem
			badgeColor={themes[theme].mentionMeColor}
		/>
	</ThemeContext.Provider>
);

stories.add('themes', () => (
	<>
		<ThemeStory theme='light' />
		<ThemeStory theme='dark' />
		<ThemeStory theme='black' />
	</>
));
