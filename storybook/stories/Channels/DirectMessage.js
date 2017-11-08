import React from 'react';
import { ScrollView } from 'react-native';

import RoomItem from '../../../app/presentation/RoomItem';

const date = new Date(2017, 10, 10, 10);

export default (
	<ScrollView>
		<RoomItem
			type='d'
			name='rocket.cat'
			_updatedAt={date}
			baseUrl='https://demo.rocket.chat'
		/>
		<RoomItem
			type='d'
			unread={0}
			_updatedAt={date}
			name='rocket.cat'
			baseUrl='https://demo.rocket.chat'
		/>
		<RoomItem
			type='d'
			unread={1}
			_updatedAt={date}
			name='rocket.cat'
			baseUrl='https://demo.rocket.chat'
		/>
		<RoomItem
			type='d'
			unread={9}
			_updatedAt={date}
			name="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries"
			baseUrl='https://demo.rocket.chat'
		/>
		<RoomItem
			type='d'
			unread={99}
			_updatedAt={date}
			name="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries"
			baseUrl='https://demo.rocket.chat'
		/>
		<RoomItem
			type='d'
			unread={100}
			_updatedAt={date}
			name="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries"
			baseUrl='https://demo.rocket.chat'
		/>
		<RoomItem
			type='d'
			unread={100000}
			_updatedAt={date}
			name="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries"
			baseUrl='https://demo.rocket.chat'
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
