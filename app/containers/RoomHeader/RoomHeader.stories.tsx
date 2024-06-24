import React from 'react';
import { Dimensions, View } from 'react-native';

import { longText } from '../../../.storybook/utils';
import { ThemeContext, TSupportedThemes } from '../../theme';
import { colors, themes } from '../../lib/constants';
import RoomHeaderComponent from './RoomHeader';

const { width, height } = Dimensions.get('window');

export default {
	title: 'RoomHeader'
};

const HeaderExample = ({ title, theme = 'light' }: { title: Function; theme?: TSupportedThemes }) => (
	// Using View directly instead of Header from react-navigation because it's easier to test.
	<View style={{ flex: 1, maxHeight: 48, backgroundColor: themes[theme].surfaceNeutral }}>{title()}</View>
);

const RoomHeader = ({ ...props }) => (
	<RoomHeaderComponent
		width={width}
		height={height}
		title='title'
		type='p'
		testID={props.title}
		onPress={() => alert('header pressed!')}
		status={props.status}
		usersTyping={props.usersTyping}
		{...props}
	/>
);

export const TitleSubtitle = () => (
	<>
		<HeaderExample title={() => <RoomHeader title='title' type='p' />} />
		<HeaderExample title={() => <RoomHeader title={longText} type='p' />} />
		<HeaderExample title={() => <RoomHeader subtitle='subtitle' />} />
		<HeaderExample title={() => <RoomHeader subtitle={longText} />} />
		<HeaderExample title={() => <RoomHeader title={longText} subtitle={longText} />} />
	</>
);

export const Icons = () => (
	<>
		<HeaderExample title={() => <RoomHeader title='private channel' type='p' />} />
		<HeaderExample title={() => <RoomHeader title='public channel' type='c' />} />
		<HeaderExample title={() => <RoomHeader title='discussion' prid='asd' />} />
		<HeaderExample title={() => <RoomHeader title='omnichannel' type='l' />} />
		<HeaderExample title={() => <RoomHeader title='private team' type='p' teamMain />} />
		<HeaderExample title={() => <RoomHeader title='public team' type='c' teamMain />} />
		<HeaderExample title={() => <RoomHeader title='group dm' type='d' isGroupChat />} />
		<HeaderExample title={() => <RoomHeader title='online dm' type='d' status='online' />} />
		<HeaderExample title={() => <RoomHeader title='away dm' type='d' status='away' />} />
		<HeaderExample title={() => <RoomHeader title='busy dm' type='d' status='busy' />} />
		<HeaderExample title={() => <RoomHeader title='loading dm' type='d' status='loading' />} />
		<HeaderExample title={() => <RoomHeader title='offline dm' type='d' />} />
	</>
);

export const Typing = () => (
	<>
		<HeaderExample title={() => <RoomHeader usersTyping={['user 1']} />} />
		<HeaderExample title={() => <RoomHeader usersTyping={['user 1', 'user 2']} />} />
		<HeaderExample title={() => <RoomHeader usersTyping={['user 1', 'user 2', 'user 3', 'user 4', 'user 5']} />} />
	</>
);

export const Thread = () => (
	<>
		<HeaderExample title={() => <RoomHeader tmid='123' parentTitle='parent title' />} />
		<HeaderExample title={() => <RoomHeader tmid='123' title={'markdown\npreview\n#3\n4\n5'} parentTitle={longText} />} />
	</>
);

const ThemeStory = ({ theme }: { theme: TSupportedThemes }) => (
	<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>
		<HeaderExample title={() => <RoomHeader subtitle='subtitle' />} theme={theme} />
	</ThemeContext.Provider>
);

export const Themes = () => (
	<>
		<ThemeStory theme='light' />
		<ThemeStory theme='dark' />
		<ThemeStory theme='black' />
	</>
);
