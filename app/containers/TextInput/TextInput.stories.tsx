import React from 'react';
import { View, StyleSheet } from 'react-native';

import { FormTextInput } from '.';

const styles = StyleSheet.create({
	paddingHorizontal: {
		paddingHorizontal: 14
	}
});

export default {
	title: 'TextInput'
};

const item = {
	name: 'Rocket.Chat',
	longText: 'https://open.rocket.chat/images/logo/android-chrome-512x512.png'
};

export const ShortAndLong = () => (
	<>
		<View style={styles.paddingHorizontal}>
			<FormTextInput label='Short Text' placeholder='placeholder' value={item.name} />

			<FormTextInput label='Long Text' placeholder='placeholder' value={item.longText} />
		</View>
	</>
);
