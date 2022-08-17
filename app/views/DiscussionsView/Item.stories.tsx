import React from 'react';
import { ScrollView } from 'react-native';

import * as List from '../../containers/List';
import { themes, colors } from '../../lib/constants';
import { ThemeContext } from '../../theme';
import Item from './Item';

const author = {
	_id: 'userid',
	username: 'rocket.cat',
	name: 'Rocket Cat'
};
const baseUrl = 'https://open.rocket.chat';
const date = new Date(2020, 10, 10, 10);
const longText =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
const defaultItem = {
	msg: 'Message content',
	tcount: 1,
	replies: [1],
	ts: date,
	tlm: date,
	u: author,
	attachments: []
};

export default {
	title: 'DiscussionsView/Item',
	decorators: [
		(Story: any) => (
			<ScrollView>
				<List.Separator />
				<Story />
				<List.Separator />
			</ScrollView>
		)
	]
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

export const Content = () => (
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
				dcount: 1000,
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
);

const ThemeStory = ({ theme }) => (
	<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>
		<BaseItem badgeColor={themes[theme].mentionMeColor} />
	</ThemeContext.Provider>
);

export const Themes = () => (
	<>
		<ThemeStory theme='light' />
		<ThemeStory theme='dark' />
		<ThemeStory theme='black' />
	</>
);
