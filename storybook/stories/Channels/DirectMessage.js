import React from 'react';
import { ScrollView } from 'react-native';

import RoomItem from '../../../app/presentation/RoomItem';

const date = '2017-10-10T10:00:00Z';
const baseUrl = 'https://open.rocket.chat';

export default (
	<ScrollView>
		<RoomItem
			type='d'
			name='rocket.cat'
			_updatedAt={date}
			baseUrl={baseUrl}
		/>
		<RoomItem
			type='d'
			unread={0}
			alert
			_updatedAt={date}
			name='rocket.cat'
			baseUrl={baseUrl}
		/>
		<RoomItem
			type='d'
			unread={1}
			_updatedAt={date}
			name='rocket.cat'
			baseUrl={baseUrl}
		/>
		<RoomItem
			type='d'
			unread={9}
			alert
			_updatedAt={date}
			name="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries"
			baseUrl={baseUrl}
		/>
		<RoomItem
			type='d'
			unread={99}
			_updatedAt={date}
			name="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries"
			baseUrl={baseUrl}
		/>
		<RoomItem
			type='d'
			unread={100}
			userMentions={0}
			_updatedAt={date}
			name="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries"
			baseUrl={baseUrl}
		/>
		<RoomItem
			type='d'
			unread={100000}
			userMentions={0}
			_updatedAt={date}
			name="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries"
			baseUrl={baseUrl}
		/>
		<RoomItem
			type='d'
			unread={100000}
			userMentions={1}
			_updatedAt={date}
			name="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries"
			baseUrl={baseUrl}
		/>
		<RoomItem
			type='d'
			name='W'
			_updatedAt={date}
			unread={-100}
		/>
		<RoomItem
			type='d'
			name='WW'
			_updatedAt={date}
			unread={-100}
		/>
		<RoomItem
			type='d'
			name=''
			_updatedAt={date}
			unread={-100}
		/>
	</ScrollView>
);
