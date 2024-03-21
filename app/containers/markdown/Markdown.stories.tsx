import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import Markdown, { MarkdownPreview } from '.';
import { themes } from '../../lib/constants';
import { TGetCustomEmoji, ICustomEmoji } from '../../definitions/IEmoji';

const theme = 'light';

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 15,
		backgroundColor: themes[theme].backgroundColor,
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

const getCustomEmoji: TGetCustomEmoji = content => {
	const customEmoji = {
		marioparty: { name: content, extension: 'gif' },
		react_rocket: { name: content, extension: 'png' },
		nyan_rocket: { name: content, extension: 'png' }
	}[content] as ICustomEmoji;
	return customEmoji;
};

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
		<Markdown msg='This is Rocket.Chat' theme={theme} />
		<Markdown msg={longText} theme={theme} />
		<Markdown msg={lineBreakText} theme={theme} />
		<Markdown msg={sequentialEmptySpacesText} theme={theme} />
		<Markdown msg='Strong emphasis, aka bold, with **asterisks** or __underscores__' theme={theme} />
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

export const Mentions = () => (
	<ScrollView style={styles.container}>
		<Markdown
			msg='@rocket.cat @name1 @all @here @unknown'
			theme={theme}
			mentions={[
				{ _id: 'random', name: 'Rocket Cat', username: 'rocket.cat' },
				{ _id: 'random2', name: 'Name', username: 'name1' },
				{ _id: 'here', username: 'here' },
				{ _id: 'all', username: 'all' }
			]}
			username='rocket.cat'
		/>
		<Markdown
			msg='@rocket.cat @name1 @all @here @unknown'
			theme={theme}
			mentions={[
				{ _id: 'random', name: 'Rocket Cat', username: 'rocket.cat' },
				{ _id: 'random2', name: 'Name', username: 'name1' },
				{ _id: 'here', username: 'here' },
				{ _id: 'all', username: 'all' }
			]}
			username='rocket.cat'
			useRealName
		/>
	</ScrollView>
);

export const Hashtag = () => (
	<View style={styles.container}>
		<Markdown msg='#test-channel #unknown' theme={theme} channels={[{ _id: '123', name: 'test-channel' }]} />
	</View>
);

export const Emoji = () => (
	<View style={styles.container}>
		<Markdown msg='Unicode: 😃😇👍' theme={theme} />
		<Markdown msg='Shortnames: :joy::+1:' theme={theme} />
		<Markdown msg='Custom emojis: :react_rocket: :nyan_rocket: :marioparty:' theme={theme} getCustomEmoji={getCustomEmoji} />
		<Markdown msg='😃 :+1: :marioparty:' theme={theme} getCustomEmoji={getCustomEmoji} />
	</View>
);

export const BlockQuote = () => (
	<View style={styles.container}>
		<Markdown
			msg={`> This is block quote
this is a normal line`}
			theme={theme}
		/>
	</View>
);

export const Links = () => (
	<View style={styles.container}>
		<Markdown msg='[Markdown link](https://rocket.chat): `[description](url)`' theme={theme} />
		<Markdown msg='<https://rocket.chat|Formatted Link>: `<url|description>`' theme={theme} />
		<Markdown msg='[Markdown link](https://rocket.chat) and the text with default style' theme={theme} />
		<Markdown
			msg='[Markdown link](https://rocket.chat) and the text with a color specific as auxiliaryText'
			theme={theme}
			style={[{ color: themes[theme].auxiliaryText }]}
		/>
	</View>
);

export const Image = () => (
	<View style={styles.container}>
		<Markdown msg='![alt text](https://play.google.com/intl/en_us/badges/images/badge_new.png)' theme={theme} />
	</View>
);

export const Headers = () => (
	<View style={styles.container}>
		<Markdown msg='# Header 1' theme={theme} />
		<Markdown msg='## Header 2' theme={theme} />
		<Markdown msg='### Header 3' theme={theme} />
		<Markdown msg='#### Header 4' theme={theme} />
		<Markdown msg='##### Header 5' theme={theme} />
		<Markdown msg='###### Header 6' theme={theme} />
	</View>
);

export const Code = () => (
	<View style={styles.container}>
		<Markdown msg='This is `inline code`' theme={theme} />
		<Markdown
			msg='Inline `code` has `back-ticks around` it.
```
Code block
```'
			theme={theme}
		/>
	</View>
);

export const Lists = () => (
	<View style={styles.container}>
		<Markdown msg={'* Open Source\n* Rocket.Chat\n  - nodejs\n  - ReactNative'} theme={theme} />
		<Markdown msg={'1. Open Source\n2. Rocket.Chat'} theme={theme} />
	</View>
);

export const Table = () => (
	<View style={styles.container}>
		<Markdown
			msg='First Header | Second Header
------------ | -------------
Content from cell 1 | Content from cell 2
Content in the first column | Content in the second column'
			theme={theme}
		/>
	</View>
);
