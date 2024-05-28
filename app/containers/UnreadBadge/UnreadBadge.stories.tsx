import React from 'react';
import { View } from 'react-native';

import { themes } from '../../lib/constants';
import UnreadBadge from '.';
import { ThemeContext, TSupportedThemes } from '../../theme';

export default {
	title: 'Unread Badge'
};

const StoryTester = ({ children }: { children: React.ReactElement | React.ReactElement[] }) => (
	<View
		style={{
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-evenly'
		}}>
		{children}
	</View>
);

export const All = () => (
	<StoryTester>
		<UnreadBadge unread={9} small />
		<UnreadBadge unread={999} small />
		<UnreadBadge unread={9} />
		<UnreadBadge unread={9999} />
		<UnreadBadge unread={9} userMentions={1} />
		<UnreadBadge unread={9} groupMentions={1} />
		<UnreadBadge unread={9} tunread={[1]} />
	</StoryTester>
);

export const Small = () => (
	<StoryTester>
		<UnreadBadge unread={9} small />
		<UnreadBadge unread={999} small />
	</StoryTester>
);

export const Normal = () => (
	<StoryTester>
		<UnreadBadge unread={9} />
		<UnreadBadge unread={9999} />
	</StoryTester>
);

export const DifferentMentionTypes = () => (
	<StoryTester>
		<UnreadBadge unread={1} />
		<UnreadBadge unread={1} userMentions={1} />
		<UnreadBadge unread={1} groupMentions={1} />
		<UnreadBadge unread={1} userMentions={1} groupMentions={1} />
		<UnreadBadge unread={1} tunread={[1]} />
		<UnreadBadge unread={1} tunreadUser={[1]} />
		<UnreadBadge unread={1} tunreadGroup={[1]} />
	</StoryTester>
);

const ThemeStory = ({ theme }: { theme: TSupportedThemes }) => (
	<ThemeContext.Provider value={{ theme, colors: themes[theme] }}>
		<StoryTester>
			<UnreadBadge unread={1} />
			<UnreadBadge unread={1} userMentions={1} />
			<UnreadBadge unread={1} groupMentions={1} />
			<UnreadBadge tunread={[1]} />
		</StoryTester>
	</ThemeContext.Provider>
);

export const Themes = () => (
	<>
		<ThemeStory theme='light' />
		<ThemeStory theme='dark' />
		<ThemeStory theme='black' />
	</>
);
