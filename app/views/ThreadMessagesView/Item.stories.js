/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types */
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { ScrollView } from 'react-native';

import Item from './Item';
import Separator from '../../containers/Separator';
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
		<Separator />
		{story()}
		<Separator />
	</ScrollView>
);

const stories = storiesOf('Thread Messages.Item', module).addDecorator(listDecorator);

stories.add('content', () => (
	<>
		<BaseItem />
		<Separator />
		<BaseItem
			item={{
				msg: longText
			}}
		/>
		<Separator />
		<BaseItem
			item={{
				tcount: 1000,
				replies: [...new Array(1000)]
			}}
		/>
		<Separator />
		<BaseItem
			item={{
				msg: '',
				attachments: [{ title: 'Attachment title' }]
			}}
		/>
		<Separator />
		<BaseItem useRealName />
	</>
));

stories.add('badge', () => (
	<>
		<BaseItem
			badgeColor={themes.light.mentionMeBackground}
		/>
		<Separator />
		<BaseItem
			badgeColor={themes.light.mentionGroupBackground}
		/>
		<Separator />
		<BaseItem
			badgeColor={themes.light.tunreadBackground}
		/>
		<BaseItem
			item={{
				msg: longText
			}}
			badgeColor={themes.light.tunreadBackground}
		/>
	</>
));

const ThemeStory = ({ theme }) => (
	<ThemeContext.Provider
		value={{ theme }}
	>
		<BaseItem
			badgeColor={themes[theme].mentionMeBackground}
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
