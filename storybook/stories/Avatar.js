import React from 'react';
import { ScrollView } from 'react-native';

import Avatar from '../../app/containers/Avatar';

export default (
	<ScrollView>
		<Avatar text='test' />
		<Avatar size={40} text='aa' />
		<Avatar size={30} text='bb' />
		<Avatar text='test' borderRadius={2} />
	</ScrollView>
);
