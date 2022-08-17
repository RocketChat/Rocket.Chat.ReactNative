import React from 'react';
import { ScrollView } from 'react-native';

import * as List from '../../containers/List';
import { themes } from '../../lib/constants';
import { ThemeContext } from '../../theme';
import Item from './Item';

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
};

export default {
	title: 'ThreadMessagesView/Item',
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
		item={{
			...defaultItem,
			...item
		}}
		onPress={() => alert('pressed')}
		{...props}
	/>
);

// const listDecorator = story => (
// 	<ScrollView>
// 		<List.Separator />
// 		{story()}
// 		<List.Separator />
// 	</ScrollView>
// );

// const stories = storiesOf('Thread Messages.Item', module)
// 	.addDecorator(listDecorator)
// 	.addDecorator(story => <Provider store={store}>{story()}</Provider>);

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
);

export const Badge = () => (
	<>
		<BaseItem badgeColor={themes.light.mentionMeColor} />
		<List.Separator />
		<BaseItem badgeColor={themes.light.mentionGroupColor} />
		<List.Separator />
		<BaseItem badgeColor={themes.light.tunreadColor} />
		<BaseItem
			item={{
				msg: longText
			}}
			badgeColor={themes.light.tunreadColor}
		/>
	</>
);

const ThemeStory = ({ theme }) => (
	<ThemeContext.Provider value={{ theme }}>
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
