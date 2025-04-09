import React, { useState } from 'react';
import { Text, View } from 'react-native';

import Button from '../Button';
import CustomModal from './CustomModel';

export default {
	title: 'CustomModal'
};

export const DefaultModal = () => {
	const [visible, setVisible] = useState(false);

	return (
		<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
			<Button title='Open Modal' onPress={() => setVisible(true)} />

			<CustomModal open={visible} onClose={() => setVisible(false)}>
				<Text style={{ fontSize: 18, marginBottom: 10 }}>Hello from Modal!</Text>
				<Button title='Close Modal' onPress={() => setVisible(false)} />
			</CustomModal>
		</View>
	);
};
