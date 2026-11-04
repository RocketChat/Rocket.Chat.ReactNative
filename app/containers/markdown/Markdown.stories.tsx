import { ScrollView, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import type { ListItem, Plain, Root, Task } from '@rocket.chat/message-parser';

import Markdown, { MarkdownPreview } from '.';
import type { NestedList, WithNested } from './components/list/NestedLists';
import { setCustomEmojis } from '~/actions/customEmojis';
import { mockedStore } from '~/reducers/mockedStore';
import { themes } from '~/lib/constants/colors';

const theme = 'light';

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 15,
		backgroundColor: themes[theme].surfaceRoom,
		marginVertical: 50
	}
});

const longText =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
const lineBreakText = `a
b
c

d


e`;
const sequentialEmptySpacesText = 'a       b                                                                             c';

const customEmojis = {
	marioparty: { name: 'marioparty', extension: 'gif' },
	react_rocket: { name: 'react_rocket', extension: 'png' },
	nyan_rocket: { name: 'nyan_rocket', extension: 'png' }
};
mockedStore.dispatch(setCustomEmojis(customEmojis));

export default {
	title: 'Markdown',
	decorators: [
		(Story: any) => (
			<NavigationContainer>
				<Story />
			</NavigationContainer>
		)
	]
};

export const Text = () => (
	<View style={styles.container}>
		<Markdown msg='This is Rocket.Chat' />
		<Markdown msg={longText} />
		<Markdown msg={lineBreakText} />
		<Markdown msg={sequentialEmptySpacesText} />
		<Markdown msg='Emphasis: *bold* _italic_ ~strikethrough~ *_bold with italic_* *~bold with strike~* *_~bold with italic and strike~_* _~italic with strike~_' />
	</View>
);

export const Preview = () => (
	<View style={styles.container}>
		<MarkdownPreview msg={longText} />
		<MarkdownPreview msg={lineBreakText} />
		<MarkdownPreview msg={sequentialEmptySpacesText} />
		<MarkdownPreview msg='@rocket.cat @name1 @all @here @unknown #general #unknown' />
		<MarkdownPreview msg='Testing: 😃 :+1: :marioparty:' />
		<MarkdownPreview msg='Fallback from new md to old' />
	</View>
);

const msgMentions = '@rocket.cat @name1 @all @here @unknown @team';
const mentions = [
	{ _id: 'random', name: 'Rocket Cat', username: 'rocket.cat', type: 'user' },
	{ _id: 'random2', name: 'Name', username: 'name1', type: 'user' },
	{ _id: 'here', username: 'here', type: 'user' },
	{ _id: 'all', username: 'all', type: 'user' },
	{ _id: 'team', name: 'team', type: 'team' }
];
const channels = [{ _id: '123', name: 'test-channel' }];

export const Mentions = () => (
	<ScrollView style={styles.container}>
		<Markdown msg={msgMentions} mentions={mentions} username='rocket.cat' />
		<Markdown msg={msgMentions} mentions={mentions} username='rocket.cat' useRealName />
	</ScrollView>
);

export const MentionsWithFormatting = () => (
	<ScrollView style={styles.container}>
		<Markdown
			msg='Normal: @rocket.cat @name1 @all @here #test-channel'
			mentions={mentions}
			channels={channels}
			username='rocket.cat'
		/>
		<Markdown
			msg='Bold: *@rocket.cat* *@name1* *@all* *@here* *#test-channel*'
			mentions={mentions}
			channels={channels}
			username='rocket.cat'
		/>
		<Markdown
			msg='Italic: _ @rocket.cat _ _ @name1 _ _ @all _ _ @here _ _ #test-channel _'
			mentions={mentions}
			channels={channels}
			username='rocket.cat'
		/>
		<Markdown
			msg='Strikethrough: ~@rocket.cat~ ~@name1~ ~@all~ ~@here~ ~#test-channel~'
			mentions={mentions}
			channels={channels}
			username='rocket.cat'
		/>
		<Markdown
			msg='Italic + Bold + Strikethrough: _~*@rocket.cat*~_ _~*@name1*~_ _~*@all*~_ _~*@here*~_ _~*#test-channel*~_'
			mentions={mentions}
			channels={channels}
			username='rocket.cat'
		/>
	</ScrollView>
);

export const Hashtag = () => (
	<View style={styles.container}>
		<Markdown msg='#test-channel #unknown' channels={channels} />
	</View>
);

export const Emoji = () => (
	<View style={styles.container}>
		<Markdown msg='Unicode: 😃😇👍' />
		<Markdown msg='Shortnames: :joy: :+1:' />
		<Markdown msg='Custom emojis: :react_rocket: :nyan_rocket: :marioparty:' />
		<Markdown msg='😃 :+1: :marioparty:' />
	</View>
);

export const BlockQuote = () => (
	<View style={styles.container}>
		<Markdown
			msg={`> This is block quote
this is a normal line`}
		/>
	</View>
);

export const Links = () => (
	<View style={styles.container}>
		<Markdown msg='[Markdown link](https://rocket.chat): `[description](url)`' />
		<Markdown msg='<https://rocket.chat|Formatted Link>: `<url|description>`' />
		<Markdown msg='[Markdown link](https://rocket.chat) and the text with default style' />
		<Markdown msg='[Markdown link](https://rocket.chat) and the text continues on the next line' />
	</View>
);

export const Image = () => (
	<View style={styles.container}>
		<Markdown msg='![alt text](https://play.google.com/intl/en_us/badges/images/badge_new.png)' />
	</View>
);

export const Headers = () => (
	<View style={styles.container}>
		<Markdown msg='# Header 1' />
		<Markdown msg='## Header 2' />
		<Markdown msg='### Header 3' />
		<Markdown msg='#### Header 4' />
	</View>
);

export const HeadersWithFormatting = () => (
	<View style={styles.container}>
		<Markdown
			msg='# H1 *bold* _italic_ ~strike~ `code` :rocket: @rocket.cat #test-channel https://rocket.chat'
			mentions={mentions}
			channels={channels}
			username='rocket.cat'
		/>
		<Markdown
			msg='## H2 *bold* _italic_ ~strike~ `code` :rocket: @rocket.cat #test-channel https://rocket.chat'
			mentions={mentions}
			channels={channels}
			username='rocket.cat'
		/>
		<Markdown
			msg='### H3 *bold* _italic_ ~strike~ `code` :rocket: @rocket.cat #test-channel https://rocket.chat'
			mentions={mentions}
			channels={channels}
			username='rocket.cat'
		/>
		<Markdown
			msg='#### H4 *bold* _italic_ ~strike~ `code` :rocket: @rocket.cat #test-channel https://rocket.chat'
			mentions={mentions}
			channels={channels}
			username='rocket.cat'
		/>
	</View>
);

export const Code = () => (
	<View style={styles.container}>
		<Markdown msg='This is `inline code`' />
		<Markdown
			msg='Inline `code` has `back-ticks around` it.
```
Code block
```'
		/>
	</View>
);

export const Lists = () => (
	<View style={styles.container}>
		<Markdown msg={'* Open Source\n* Rocket.Chat\n  - nodejs\n  - ReactNative'} />
		<Markdown msg={'1. Open Source\n2. Rocket.Chat'} />
		<Markdown
			msg={
				'- *bold* \n- _italic_ \n- ~strikethrough~ \n- _*bold italic*_ \n- *~bold strikethrough~* \n- _~italic strikethrough~_ \n- _*~bold italic strikethrough~*_'
			}
		/>
	</View>
);

const plain = (value: string): Plain[] => [{ type: 'PLAIN_TEXT', value }];
const item = (value: string, extra?: { number?: number; nested?: NestedList[] }): WithNested<ListItem> => ({
	type: 'LIST_ITEM',
	value: plain(value),
	...extra
});
const task = (status: boolean, value: string, nested?: NestedList[]): WithNested<Task> => ({
	type: 'TASK',
	status,
	value: plain(value),
	...(nested && { nested })
});
const nestedListsMd: Root = [
	{
		type: 'UNORDERED_LIST',
		value: [
			item('item 1', { nested: [{ type: 'UNORDERED_LIST', value: [item('subitem A'), item('subitem B')] }] }),
			item('item 2')
		]
	},
	{
		type: 'ORDERED_LIST',
		value: [
			item('first', {
				number: 1,
				nested: [
					{
						type: 'TASKS',
						value: [task(true, 'done'), task(false, 'todo', [{ type: 'ORDERED_LIST', value: [item('deep', { number: 1 })] }])]
					}
				]
			}),
			item('second', { number: 2 })
		]
	}
];
const nestedListsMsg =
	'- item 1\n  - subitem A\n  - subitem B\n- item 2\n\n1. first\n   - [x] done\n   - [ ] todo\n     1. deep\n2. second';

export const NestedLists = () => (
	<View style={styles.container}>
		<Markdown msg={nestedListsMsg} md={nestedListsMd} />
	</View>
);

export const Timestamp = () => (
	<View style={styles.container}>
		<Markdown msg='Unix timestamp formats' />
		<Markdown msg='t - Short time: <t:1735689600:t>' />
		<Markdown msg='T - Long time: <t:1735689600:T>' />
		<Markdown msg='d - Short date: <t:1735689600:d>' />
		<Markdown msg='D - Long date: <t:1735689600:D>' />
		<Markdown msg='f - Short date/time: <t:1735689600:f>' />
		<Markdown msg='F - Long date/time: <t:1735689600:F>' />
		<Markdown msg='R - Relative time: <t:1735689600:R>' />

		<Markdown msg='ISO timestamp formats' />
		<Markdown msg='t - Short time: <t:2025-01-01T00:00:00.000+00:00:t>' />
		<Markdown msg='T - Long time: <t:2025-01-01T00:00:00.000+00:00:T>' />
		<Markdown msg='d - Short date: <t:2025-01-01T00:00:00.000+00:00:d>' />
		<Markdown msg='D - Long date: <t:2025-01-01T00:00:00.000+00:00:D>' />
		<Markdown msg='f - Short date/time: <t:2025-01-01T00:00:00.000+00:00:f>' />
		<Markdown msg='F - Long date/time: <t:2025-01-01T00:00:00.000+00:00:F>' />
		<Markdown msg='R - Relative time: <t:2025-01-01T00:00:00.000+00:00:R>' />
	</View>
);

const textStyle = { fontSize: 10, color: 'red' };
export const TextStyle = () => (
	<View style={styles.container}>
		<Markdown
			msg='Emphasis: *bold* _italic_ ~strikethrough~ *_bold with italic_* *~bold with strike~* *_~bold with italic and strike~_* _~italic with strike~_'
			textStyle={textStyle}
		/>
		<Markdown msg={msgMentions} mentions={mentions} username='rocket.cat' textStyle={textStyle} />
		<Markdown msg='#test-channel #unknown' channels={channels} textStyle={textStyle} />
		<Markdown
			msg={`> This is block quote
this is a normal line`}
			textStyle={textStyle}
		/>
		<Markdown msg='[Markdown link](https://rocket.chat)' textStyle={textStyle} />
	</View>
);
