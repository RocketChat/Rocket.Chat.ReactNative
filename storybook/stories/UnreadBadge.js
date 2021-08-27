/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types */
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { View } from 'react-native';

import UnreadBadge from '../../app/presentation/UnreadBadge';
import { ThemeContext } from '../../app/theme';

const stories = storiesOf('Unread Badge', module);

const StoryTester = ({ children }) => (
	<View
		style={{
			flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly'
		}}
	>
		{children}
	</View>
);

stories.add('all', () => (
	<StoryTester>
		<UnreadBadge unread={9} small />
		<UnreadBadge unread={999} small />
		<UnreadBadge unread={9} />
		<UnreadBadge unread={9999} />
		<UnreadBadge unread={9} userMentions={1} />
		<UnreadBadge unread={9} groupMentions={1} />
		<UnreadBadge unread={9} tunread={[1]} />
	</StoryTester>
));

stories.add('small', () => (
	<StoryTester>
		<UnreadBadge unread={9} small />
		<UnreadBadge unread={999} small />
	</StoryTester>
));

stories.add('normal', () => (
	<StoryTester>
		<UnreadBadge unread={9} />
		<UnreadBadge unread={9999} />
	</StoryTester>
));

stories.add('different mention types', () => (
	<StoryTester>
		<UnreadBadge unread={1} />
		<UnreadBadge unread={1} userMentions={1} />
		<UnreadBadge unread={1} groupMentions={1} />
		<UnreadBadge unread={1} userMentions={1} groupMentions={1} />
		<UnreadBadge unread={1} tunread={[1]} />
		<UnreadBadge unread={1} tunreadUser={[1]} />
		<UnreadBadge unread={1} tunreadGroup={[1]} />
	</StoryTester>
));

const ThemeStory = ({ theme }) => (
	<ThemeContext.Provider
		value={{ theme }}
	>
		<StoryTester>
			<UnreadBadge unread={1} />
			<UnreadBadge unread={1} userMentions={1} />
			<UnreadBadge unread={1} groupMentions={1} />
			<UnreadBadge tunread={[1]} />
		</StoryTester>
	</ThemeContext.Provider>
);

stories.add('themes', () => (
	<>
		<ThemeStory theme='light' />
		<ThemeStory theme='dark' />
		<ThemeStory theme='black' />
	</>
));
