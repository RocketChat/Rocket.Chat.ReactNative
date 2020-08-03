import React from 'react';
import { ScrollView, Dimensions } from 'react-native';
// import moment from 'moment';

import { themes } from '../../app/constants/colors';
import RoomItemComponent from '../../app/presentation/RoomItem/RoomItem';
import StoriesSeparator from './StoriesSeparator';

const baseUrl = 'https://open.rocket.chat';
const { width } = Dimensions.get('window');
let _theme = 'light';
const longText = 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries';
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
			<RoomItem alert name='user mentions' unread={1000} userMentions={1} />
			<RoomItem alert name='group mentions' unread={1} groupMentions={1} />
			<RoomItem alert name='group mentions' unread={1000} groupMentions={1} />
			<RoomItem name='user mentions > group mentions' alert unread={1000} userMentions={1} groupMentions={1} />

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
				unread={1000}
				lastMessage={lastMessage}
			/>
		</ScrollView>
	);
};
