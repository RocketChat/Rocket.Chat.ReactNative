import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { storiesOf } from '@storybook/react-native';
import { Provider } from 'react-redux';

import Markdown, { MarkdownPreview } from '../../app/containers/markdown';
import { themes } from '../../app/lib/constants';
import { TGetCustomEmoji, IEmoji } from '../../app/definitions/IEmoji';
import { store } from '.';

const theme = 'light';

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 15,
		backgroundColor: themes[theme].backgroundColor,
		marginVertical: 50
	},
	separator: {
		marginHorizontal: 10,
		marginVertical: 10
	}
});

const baseUrl = 'https://open.rocket.chat';
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
	}[content] as IEmoji;
	return customEmoji;
};

const stories = storiesOf('Markdown', module).addDecorator(story => <Provider store={store}>{story()}</Provider>);

stories.add('Text', () => (
	<View style={styles.container}>
		<Markdown msg='This is Rocket.Chat' />
		<Markdown msg={longText} />
		<Markdown msg={lineBreakText} />
		<Markdown msg={sequentialEmptySpacesText} />
		<Markdown msg='Strong emphasis, aka bold, with **asterisks** or __underscores__' />
	</View>
));

stories.add('Preview', () => (
	<View style={styles.container}>
		<MarkdownPreview msg={longText} />
		<MarkdownPreview msg={lineBreakText} />
		<MarkdownPreview msg={sequentialEmptySpacesText} />
		<MarkdownPreview msg='@rocket.cat @name1 @all @here @unknown #general #unknown' />
		<MarkdownPreview msg='Testing: 😃 :+1: :marioparty:' />
		<MarkdownPreview msg='Fallback from new md to old' />
	</View>
));

stories.add('Mentions', () => (
	<ScrollView style={styles.container}>
		<Markdown
			msg='@rocket.cat @name1 @all @here @unknown'
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
));

stories.add('Hashtag', () => (
	<View style={styles.container}>
		<Markdown msg='#test-channel #unknown' channels={[{ _id: '123', name: 'test-channel' }]} />
	</View>
));

stories.add('Emoji', () => (
	<View style={styles.container}>
		<Markdown msg='Unicode: 😃😇👍' />
		<Markdown msg='Shortnames: :joy::+1:' />
		<Markdown msg='Custom emojis: :react_rocket: :nyan_rocket: :marioparty:' getCustomEmoji={getCustomEmoji} baseUrl={baseUrl} />
		<Markdown msg='😃 :+1: :marioparty:' getCustomEmoji={getCustomEmoji} baseUrl={baseUrl} />
	</View>
));

stories.add('Block quote', () => (
	<View style={styles.container}>
		<Markdown
			msg={`> This is block quote
this is a normal line`}
		/>
	</View>
));

stories.add('Links', () => (
	<View style={styles.container}>
		<Markdown msg='[Markdown link](https://rocket.chat): `[description](url)`' />
		<Markdown msg='<https://rocket.chat|Formatted Link>: `<url|description>`' />
	</View>
));

stories.add('Image', () => (
	<View style={styles.container}>
		<Markdown msg='![alt text](https://play.google.com/intl/en_us/badges/images/badge_new.png)' />
	</View>
));

stories.add('Headers', () => (
	<View style={styles.container}>
		<Markdown msg='# Header 1' />
		<Markdown msg='## Header 2' />
		<Markdown msg='### Header 3' />
		<Markdown msg='#### Header 4' />
		<Markdown msg='##### Header 5' />
		<Markdown msg='###### Header 6' />
	</View>
));

stories.add('Code', () => (
	<View style={styles.container}>
		<Markdown msg='This is `inline code`' />
		<Markdown
			msg='Inline `code` has `back-ticks around` it.
```
Code block
```'
		/>
	</View>
));

stories.add('Lists', () => (
	<View style={styles.container}>
		<Markdown msg={'* Open Source\n* Rocket.Chat\n  - nodejs\n  - ReactNative'} />
		<Markdown msg={'1. Open Source\n2. Rocket.Chat'} />
	</View>
));

stories.add('Table', () => (
	<View style={styles.container}>
		<Markdown
			msg='First Header | Second Header
------------ | -------------
Content from cell 1 | Content from cell 2
Content in the first column | Content in the second column'
		/>
	</View>
));
