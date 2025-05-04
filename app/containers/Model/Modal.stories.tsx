import React, { useState } from 'react';
import { Text, View } from 'react-native';

import Button from '../Button';
import Modal from './Modal';

export default {
	title: 'Modal'
};

export const DefaultModal = () => {
	const [visible, setVisible] = useState(false);

	return (
		<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
			<Button title='Open Modal' onPress={() => setVisible(true)} />

			<Modal open={visible} onClose={() => setVisible(false)}>
				<Text style={{ fontSize: 18, marginBottom: 10 }}>Hello from Modal!</Text>
				<Button title='Close Modal' onPress={() => setVisible(false)} />
			</Modal>
		</View>
	);
};
