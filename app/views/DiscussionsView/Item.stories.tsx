import { ScrollView } from 'react-native';

import * as List from '../../containers/List';
import { type TSupportedThemes } from '../../theme';
import ThemeStory from '../../stories/ThemeStory';
import Item, { type IItem } from './Item';

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

const ThemeVariant = ({ theme }: { theme: TSupportedThemes }) => (
	<ThemeStory theme={theme}>
		<BaseItem />
	</ThemeStory>
);

export const ThemeLight = () => <ThemeVariant theme='light' />;
export const ThemeDark = () => <ThemeVariant theme='dark' />;
export const ThemeBlack = () => <ThemeVariant theme='black' />;
