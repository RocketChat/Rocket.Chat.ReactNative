import React from 'react';
import { ScrollView } from 'react-native';

import * as List from '../../containers/List';
import { colors } from '../../lib/constants';
import { ThemeContext, TSupportedThemes } from '../../theme';
import Item, { IItem } from './Item';

const author = {
	_id: 'userid',
	username: 'rocket.cat',
	name: 'Rocket Cat'
};
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
} as unknown as IItem['item'];

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

const BaseItem = ({ item }: { item?: Partial<IItem['item']> }) => (
	<Item
		item={{
			...defaultItem,
			...item
		}}
		onPress={() => alert('pressed')}
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
				dcount: 1000
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
		{/* @ts-ignore: FIXME: useRealName is not working */}
		<BaseItem useRealName />
	</>
);

const ThemeStory = ({ theme }: { theme: TSupportedThemes }) => (
	<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>
		<BaseItem />
	</ThemeContext.Provider>
);

export const Themes = () => (
	<>
		<ThemeStory theme='light' />
		<ThemeStory theme='dark' />
		<ThemeStory theme='black' />
	</>
);
