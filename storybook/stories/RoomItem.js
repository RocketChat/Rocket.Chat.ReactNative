import React from 'react';
import { ScrollView } from 'react-native';
// import moment from 'moment';

import RoomItemComponent from '../../app/presentation/RoomItem';
import StoriesSeparator from './StoriesSeparator';

const date = '2017-10-10T10:00:00Z';
const baseUrl = 'https://open.rocket.chat';

const RoomItem = props => (
	<RoomItemComponent
		type='d'
		name='rocket.cat'
		_updatedAt={date}
		baseUrl={baseUrl}
		{...props}
	/>
);

export default (
	<ScrollView>
		<StoriesSeparator title='Basic' />
		<RoomItem />

		<StoriesSeparator title='User' />
		<RoomItem name='diego.mello' />
		<RoomItem
			name="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries"
		/>

		<StoriesSeparator title='Type' />
		<RoomItem type='d' />
		<RoomItem type='c' />
		<RoomItem type='p' />
		<RoomItem type='l' />
		<RoomItem type='&' />

		{/* We can't add date stories because it breaks jest snapshots
		<StoriesSeparator title='Date' />
		<RoomItem
			_updatedAt={moment()}
		/>
		<RoomItem
			_updatedAt={moment().subtract(1, 'day')}
		/>
		<RoomItem
			_updatedAt={moment().subtract(5, 'day')}
		/>
		<RoomItem
			_updatedAt={moment().subtract(30, 'day')}
		/> */}

		<StoriesSeparator title='Alerts' />
		<RoomItem alert />
		<RoomItem alert unread={1} />
		<RoomItem alert unread={1000} />
		<RoomItem alert unread={1} userMentions={1} />
		<RoomItem alert unread={1000} userMentions={1} />
		<RoomItem alert name='general' unread={1} type='c' />
		<RoomItem alert name='general' unread={1000} type='c' />
		<RoomItem alert name='general' unread={1} userMentions={1} type='c' />
		<RoomItem alert name='general' unread={1000} userMentions={1} type='c' />

		<StoriesSeparator title='Last Message' />
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
		/>
		<RoomItem
			showLastMessage
			lastMessage={{
				u: {
					username: 'diego.mello'
				},
				msg: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries'
			}}
		/>
		<RoomItem
			showLastMessage
			alert
			unread={1}
			lastMessage={{
				u: {
					username: 'diego.mello'
				},
				msg: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries'
			}}
		/>
		<RoomItem
			showLastMessage
			alert
			unread={1000}
			lastMessage={{
				u: {
					username: 'diego.mello'
				},
				msg: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries'
			}}
		/>
	</ScrollView>
);
