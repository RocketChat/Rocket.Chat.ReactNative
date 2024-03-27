import React from 'react';
import { ScrollView } from 'react-native';

import * as List from '../../containers/List';
import { themes } from '../../lib/constants';
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

const BaseItem = ({
	item,
	useRealName = false,
	badgeColor
}: {
	item?: any;
	useRealName?: IItem['useRealName'];
	badgeColor?: IItem['badgeColor'];
}) => (
	<Item
		item={{
			...defaultItem,
			...item
		}}
		useRealName={useRealName}
		badgeColor={badgeColor}
		user={{ id: 'abc' }}
		toggleFollowThread={() => alert('toggleFollowThread')}
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
		<BaseItem badgeColor={themes.light.badgeBackgroundLevel4} />
		<List.Separator />
		<BaseItem badgeColor={themes.light.badgeBackgroundLevel3} />
		<List.Separator />
		<BaseItem badgeColor={themes.light.fontInfo} />
		<BaseItem
			item={{
				msg: longText
			}}
			badgeColor={themes.light.fontInfo}
		/>
	</>
);

const ThemeStory = ({ theme }: { theme: TSupportedThemes }) => (
	<ThemeContext.Provider value={{ theme, colors: themes[theme] }}>
		<BaseItem badgeColor={themes[theme].badgeBackgroundLevel4} />
	</ThemeContext.Provider>
);

export const Themes = () => (
	<>
		<ThemeStory theme='light' />
		<ThemeStory theme='dark' />
		<ThemeStory theme='black' />
	</>
);
