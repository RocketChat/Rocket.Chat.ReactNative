import React from 'react';
import { ScrollView } from 'react-native';

import RoomItem from '../../../app/components/RoomItem';

export default (
	<ScrollView>
		<RoomItem
			type='d'
			name='rocket.cat'
			baseUrl='https://demo.rocket.chat'
		/>
		<RoomItem
			type='d'
			unread={0}
			name='rocket.cat'
			baseUrl='https://demo.rocket.chat'
		/>
		<RoomItem
			type='d'
			unread={1}
			name='rocket.cat'
			baseUrl='https://demo.rocket.chat'
		/>
		<RoomItem
			type='d'
			unread={9}
			name="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries"
			baseUrl='https://demo.rocket.chat'
		/>
		<RoomItem
			type='d'
			unread={99}
			name="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries"
			baseUrl='https://demo.rocket.chat'
		/>
		<RoomItem
			type='d'
			unread={100}
			name="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries"
			baseUrl='https://demo.rocket.chat'
		/>
		<RoomItem
			type='d'
			unread={100000}
			name="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries"
			baseUrl='https://demo.rocket.chat'
		/>
		<RoomItem
			type='d'
			name='W'
			unread={-100}
		/>
		<RoomItem
			type='d'
			name='WW'
			unread={-100}
		/>
		<RoomItem
			type='d'
			name=''
			unread={-100}
		/>
	</ScrollView>
);
