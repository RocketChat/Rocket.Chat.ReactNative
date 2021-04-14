/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types, react/destructuring-assignment */
import React from 'react';
import { View, Dimensions } from 'react-native';
import { storiesOf } from '@storybook/react-native';

import RoomHeaderComponent from './RoomHeader';
import Header from '../Header';
import { longText } from '../../../storybook/utils';
import { ThemeContext } from '../../theme';

const stories = storiesOf('RoomHeader', module);

// TODO: refactor after react-navigation v6
const HeaderExample = ({ title }) => (
	<Header
		headerTitle={() => (
			<View style={{ flex: 1, paddingHorizontal: 12 }}>
				{title()}
			</View>
		)}
	/>
);

const { width, height } = Dimensions.get('window');

const RoomHeader = ({ ...props }) => (
	<RoomHeaderComponent width={width} height={height} title='title' type='p' testID={props.title} onPress={() => alert('header pressed!')} {...props} />
);

stories.add('title and subtitle', () => (
	<>
		<HeaderExample title={() => <RoomHeader title='title' type='p' />} />
		<HeaderExample title={() => <RoomHeader title={longText} type='p' />} />
		<HeaderExample title={() => <RoomHeader subtitle='subtitle' />} />
		<HeaderExample title={() => <RoomHeader subtitle={longText} />} />
		<HeaderExample title={() => <RoomHeader title={longText} subtitle={longText} />} />
	</>
));

stories.add('icons', () => (
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
));

stories.add('typing', () => (
	<>
		<HeaderExample title={() => <RoomHeader usersTyping={['user 1']} />} />
		<HeaderExample title={() => <RoomHeader usersTyping={['user 1', 'user 2']} />} />
		<HeaderExample title={() => <RoomHeader usersTyping={['user 1', 'user 2', 'user 3', 'user 4', 'user 5']} />} />
	</>
));

stories.add('landscape', () => (
	<>
		<HeaderExample title={() => <RoomHeader width={height} height={width} />} />
		<HeaderExample title={() => <RoomHeader width={height} height={width} subtitle='subtitle' />} />
		<HeaderExample title={() => <RoomHeader width={height} height={width} title={longText} subtitle={longText} />} />
	</>
));

stories.add('thread', () => (
	<>
		<HeaderExample title={() => <RoomHeader tmid='123' parentTitle='parent title' />} />
		<HeaderExample title={() => <RoomHeader tmid='123' title={'markdown\npreview\n#3\n4\n5'} parentTitle={longText} />} />
	</>
));

const ThemeStory = ({ theme }) => (
	<ThemeContext.Provider
		value={{ theme }}
	>
		<HeaderExample title={() => <RoomHeader subtitle='subtitle' />} />
	</ThemeContext.Provider>
);

stories.add('themes', () => (
	<>
		<ThemeStory theme='light' />
		<ThemeStory theme='dark' />
		<ThemeStory theme='black' />
	</>
));
