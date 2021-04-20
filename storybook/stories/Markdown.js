/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { storiesOf } from '@storybook/react-native';

import Markdown from '../../app/containers/markdown';
import { themes } from '../../app/constants/colors';


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
const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
const lineBreakText = `a
b
c

d


e`;
const sequentialEmptySpacesText = 'a       b                                                                             c';

const getCustomEmoji = (content) => {
	const customEmoji = {
		marioparty: { name: content, extension: 'gif' },
		react_rocket: { name: content, extension: 'png' },
		nyan_rocket: { name: content, extension: 'png' }
	}[content];
	return customEmoji;
};

const stories = storiesOf('Markdown', module);

stories.add('Text', () => (
	<View style={styles.container}>
		<Markdown msg='This is Rocket.Chat' theme={theme} />
		<Markdown
			msg={longText}
			theme={theme}
		/>
		<Markdown
			msg={lineBreakText}
			theme={theme}
		/>
		<Markdown
			msg={sequentialEmptySpacesText}
			theme={theme}
		/>
		<Markdown
			msg='Strong emphasis, aka bold, with **asterisks** or __underscores__'
			theme={theme}
		/>
	</View>
));

stories.add('Edited', () => (
	<View style={styles.container}>
		<Markdown
			msg='This is edited'
			theme={theme}
			isEdited
		/>
	</View>
));

stories.add('Preview', () => (
	<View style={styles.container}>
		<Markdown
			msg={longText}
			theme={theme}
			numberOfLines={1}
			preview
		/>
		<Markdown
			msg={lineBreakText}
			theme={theme}
			numberOfLines={1}
			preview
		/>
		<Markdown
			msg={sequentialEmptySpacesText}
			theme={theme}
			numberOfLines={1}
			preview
		/>
		<Markdown
			msg='@rocket.cat @name1 @all @here @unknown #general #unknown'
			theme={theme}
			numberOfLines={1}
			preview
			mentions={[
				{ _id: 'random', name: 'Rocket Cat', username: 'rocket.cat' },
				{ _id: 'random2', name: 'Name', username: 'name1' },
				{ _id: 'here', username: 'here' },
				{ _id: 'all', username: 'all' }
			]}
			channels={[{ _id: '123', name: 'test-channel' }]}
			username='rocket.cat'
		/>
		<Markdown
			msg='Testing: 😃 :+1: :marioparty:'
			getCustomEmoji={getCustomEmoji}
			theme={theme}
			numberOfLines={1}
			preview
		/>
	</View>
));

stories.add('Mentions', () => (
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
));

stories.add('Hashtag', () => (
	<View style={styles.container}>
		<Markdown
			msg='#test-channel #unknown'
			theme={theme}
			channels={[{ _id: '123', name: 'test-channel' }]}
		/>
	</View>
));

stories.add('Emoji', () => (
	<View style={styles.container}>
		<Markdown msg='Unicode: 😃😇👍' theme={theme} />
		<Markdown msg='Shortnames: :joy::+1:' theme={theme} />
		<Markdown
			msg='Custom emojis: :react_rocket: :nyan_rocket: :marioparty:'
			theme={theme}
			getCustomEmoji={getCustomEmoji}
			baseUrl={baseUrl}
		/>
		<Markdown
			msg='😃 :+1: :marioparty:'
			theme={theme}
			getCustomEmoji={getCustomEmoji}
			baseUrl={baseUrl}
		/>
	</View>
));

stories.add('Block quote', () => (
	<View style={styles.container}>
		<Markdown
			msg={`> This is block quote
this is a normal line`}
			theme={theme}
		/>
	</View>
));

stories.add('Links', () => (
	<View style={styles.container}>
		<Markdown msg='[Markdown link](https://rocket.chat): `[description](url)`' theme={theme} />
		<Markdown msg='<https://rocket.chat|Formatted Link>: `<url|description>`' theme={theme} />
	</View>
));


stories.add('Image', () => (
	<View style={styles.container}>
		<Markdown msg='![alt text](https://play.google.com/intl/en_us/badges/images/badge_new.png)' theme={theme} />
	</View>
));

stories.add('Headers', () => (
	<View style={styles.container}>
		<Markdown
			msg='# Header 1'
			theme={theme}
		/>
		<Markdown
			msg='## Header 2'
			theme={theme}
		/>
		<Markdown
			msg='### Header 3'
			theme={theme}
		/>
		<Markdown
			msg='#### Header 4'
			theme={theme}
		/>
		<Markdown
			msg='##### Header 5'
			theme={theme}
		/>
		<Markdown
			msg='###### Header 6'
			theme={theme}
		/>
	</View>
));

stories.add('Code', () => (
	<View style={styles.container}>
		<Markdown
			msg='This is `inline code`'
			theme={theme}
		/>
		<Markdown
			msg='Inline `code` has `back-ticks around` it.
```
Code block
```'
			theme={theme}
		/>
	</View>
));

stories.add('Lists', () => (
	<View style={styles.container}>
		<Markdown
			msg={'* Open Source\n* Rocket.Chat\n  - nodejs\n  - ReactNative'}
			theme={theme}
		/>
		<Markdown
			msg={'1. Open Source\n2. Rocket.Chat'}
			theme={theme}
		/>
	</View>
));

stories.add('Table', () => (
	<View style={styles.container}>
		<Markdown
			msg='First Header | Second Header
------------ | -------------
Content from cell 1 | Content from cell 2
Content in the first column | Content in the second column'
			theme={theme}
		/>
	</View>
));
