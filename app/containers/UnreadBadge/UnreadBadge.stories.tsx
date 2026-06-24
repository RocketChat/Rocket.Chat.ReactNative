import { type ReactElement } from 'react';
import { View } from 'react-native';

import UnreadBadge from '.';
import { type TSupportedThemes } from '../../theme';
import ThemeStory from '../../stories/ThemeStory';

export default {
	title: 'Unread Badge'
};

const StoryTester = ({ children }: { children: ReactElement | ReactElement[] }) => (
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

const ThemeVariant = ({ theme }: { theme: TSupportedThemes }) => (
	<ThemeStory theme={theme}>
		<StoryTester>
			<UnreadBadge unread={1} />
			<UnreadBadge unread={1} userMentions={1} />
			<UnreadBadge unread={1} groupMentions={1} />
			<UnreadBadge tunread={[1]} />
		</StoryTester>
	</ThemeStory>
);

export const ThemeLight = () => <ThemeVariant theme='light' />;
export const ThemeDark = () => <ThemeVariant theme='dark' />;
export const ThemeBlack = () => <ThemeVariant theme='black' />;
