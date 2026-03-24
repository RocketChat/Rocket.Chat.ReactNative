import React from 'react';
import { ScrollView } from 'react-native';

import DirectoryItem from './index';
import { themes } from '../../lib/constants/colors';

const _theme = 'light';

export default {
	title: 'DirectoryItem',
	decorators: [
		(Story: any) => (
			<ScrollView style={{ backgroundColor: themes[_theme].surfaceRoom }}>
				<Story />
			</ScrollView>
		)
	]
};
const onPress = () => console.log('Pressed!');

export const Default = () => (
	<DirectoryItem title='General' description='A public room' avatar='G' type='c' onPress={onPress} testID='directory-item' />
);

export const WithRightLabel = () => (
	<DirectoryItem
		title='General'
		description='Room with label'
		avatar='G'
		type='c'
		rightLabel='123 members'
		onPress={onPress}
		testID='directory-item-label'
	/>
);

export const LongRoomName = () => (
	<DirectoryItem
		title='This is a very very very very very very very long room name that should be truncated'
		description='Long name test'
		avatar='L'
		type='c'
		rightLabel='9999 members'
		onPress={onPress}
		testID='directory-item-long'
	/>
);

export const WithoutDescription = () => (
	<DirectoryItem title='No description room' avatar='N' type='c' onPress={onPress} testID='directory-item-no-desc' />
);

export const DirectMessage = () => (
	<DirectoryItem
		title='Alice Johnson'
		description='Hey there!'
		avatar='A'
		type='d'
		onPress={onPress}
		testID='directory-item-dm'
	/>
);

export const TeamMain = () => (
	<DirectoryItem
		title='Engineering Team'
		description='Main team room'
		avatar='E'
		type='c'
		teamMain
		onPress={onPress}
		testID='directory-item-team'
	/>
);

export const OnlyTitle = () => <DirectoryItem title='Just a title' type='c' onPress={onPress} testID='directory-item-title' />;

export const CustomStyle = () => (
	<DirectoryItem
		title='Styled Room'
		description='Custom style applied'
		avatar='S'
		type='c'
		style={{ backgroundColor: '#e0e0e0' }}
		onPress={onPress}
		testID='directory-item-style'
	/>
);
