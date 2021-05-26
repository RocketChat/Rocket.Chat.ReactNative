/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { ScrollView, Dimensions } from 'react-native';
import { storiesOf } from '@storybook/react-native';
import { Provider } from 'react-redux';

import { themes } from '../../app/constants/colors';
import RoomItemComponent from '../../app/presentation/RoomItem/RoomItem';
import { longText } from '../utils';
import { store } from './index';

const baseUrl = 'https://open.rocket.chat';
const { width } = Dimensions.get('window');
const _theme = 'light';
const lastMessage = {
	u: {
		username: 'diego.mello'
	},
	msg: longText
};
const updatedAt = {
	date: '10:00'
};

const RoomItem = props => (
	<RoomItemComponent
		type='d'
		name='rocket.cat'
		avatar='rocket.cat'
		baseUrl={baseUrl}
		width={width}
		theme={_theme}
		{...updatedAt}
		{...props}
	/>
);

const stories = storiesOf('Room Item', module)
	.addDecorator(story => <Provider store={store}>{story()}</Provider>)
	.addDecorator(story => <ScrollView style={{ backgroundColor: themes[_theme].backgroundColor }}>{story()}</ScrollView>);


stories.add('Basic', () => (
	<RoomItem />
));


stories.add('User', () => (
	<>
		<RoomItem name='diego.mello' avatar='diego.mello' />
		<RoomItem
			name={longText}
		/>
	</>
));

stories.add('Type', () => (
	<>
		<RoomItem type='d' />
		<RoomItem type='c' />
		<RoomItem type='p' />
		<RoomItem type='l' />
		<RoomItem type='discussion' />
		<RoomItem type='d' isGroupChat />
		<RoomItem type='&' />
	</>
));

stories.add('User status', () => (
	<>
		<RoomItem status='online' />
		<RoomItem status='away' />
		<RoomItem status='busy' />
		<RoomItem status='offline' />
		<RoomItem status='loading' />
		<RoomItem status='wrong' />
	</>
));

stories.add('Alerts', () => (
	<>
		<RoomItem alert />
		<RoomItem alert name='unread' unread={1} />
		<RoomItem alert name='unread' unread={1000} />
		<RoomItem alert name='user mentions' unread={1} userMentions={1} />
		<RoomItem alert name='group mentions' unread={1} groupMentions={1} />
		<RoomItem alert name='thread unread' tunread={[1]} />
		<RoomItem alert name='thread unread user' tunread={[1]} tunreadUser={[1]} />
		<RoomItem alert name='thread unread group' tunread={[1]} tunreadGroup={[1]} />
		<RoomItem name='user mentions priority 1' alert unread={1} userMentions={1} groupMentions={1} tunread={[1]} />
		<RoomItem name='group mentions priority 2' alert unread={1} groupMentions={1} tunread={[1]} />
		<RoomItem name='thread unread priority 3' alert unread={1} tunread={[1]} />
	</>
));

stories.add('Tag', () => (
	<>
		<RoomItem autoJoin />
		<RoomItem showLastMessage autoJoin />
		<RoomItem name={longText} autoJoin />
		<RoomItem name={longText} autoJoin showLastMessage />
	</>
));

stories.add('Last Message', () => (
	<>
		<RoomItem
			showLastMessage
		/>
		<RoomItem
			showLastMessage
			lastMessage={{
				u: {
					username: 'rocket.chat'
				},
				msg: '2'
			}}
		/>
		<RoomItem
			showLastMessage
			lastMessage={{
				u: {
					username: 'diego.mello'
				},
				msg: '1'
			}}
			username='diego.mello'
		/>
		<RoomItem
			showLastMessage
			lastMessage={lastMessage}
		/>
		<RoomItem
			showLastMessage
			alert
			unread={1}
			lastMessage={lastMessage}
		/>
		<RoomItem
			showLastMessage
			alert
			unread={1000}
			lastMessage={lastMessage}
		/>
		<RoomItem
			showLastMessage
			alert
			tunread={[1]}
			lastMessage={lastMessage}
		/>
	</>
));
