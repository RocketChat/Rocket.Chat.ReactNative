import React from 'react';
import { ScrollView, Dimensions } from 'react-native';
// import moment from 'moment';

import { themes } from '../../app/constants/colors';
import RoomItemComponent from '../../app/presentation/RoomItem/RoomItem';
import { longText } from '../utils';
import StoriesSeparator from './StoriesSeparator';

const baseUrl = 'https://open.rocket.chat';
const { width } = Dimensions.get('window');
let _theme = 'light';
const lastMessage = {
	u: {
		username: 'diego.mello'
	},
	msg: longText
};
const updatedAt = {
	date: '10:00',
	roomUpdatedAt: new Date('2020-01-01')
};

const RoomItem = props => (
	<RoomItemComponent
		rid='abc'
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

// eslint-disable-next-line react/prop-types
const Separator = ({ title }) => <StoriesSeparator title={title} theme={_theme} />;

// eslint-disable-next-line react/prop-types
export default ({ theme }) => {
	_theme = theme;
	return (
		<ScrollView style={{ backgroundColor: themes[theme].auxiliaryBackground }}>
			<Separator title='Basic' />
			<RoomItem />

			<Separator title='User' />
			<RoomItem name='diego.mello' avatar='diego.mello' />
			<RoomItem
				name={longText}
			/>

			<Separator title='Type' />
			<RoomItem type='d' />
			<RoomItem type='c' />
			<RoomItem type='p' />
			<RoomItem type='l' />
			<RoomItem type='discussion' />
			<RoomItem type='d' isGroupChat />
			<RoomItem type='&' />

			<Separator title='User status' />
			<RoomItem status='online' />
			<RoomItem status='away' />
			<RoomItem status='busy' />
			<RoomItem status='offline' />
			<RoomItem status='wrong' />

			<Separator title='Alerts' />
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

			<Separator title='Last Message' />
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
		</ScrollView>
	);
};
