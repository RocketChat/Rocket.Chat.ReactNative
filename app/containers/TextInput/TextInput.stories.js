/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types */
import React from 'react';
import { storiesOf } from '@storybook/react-native';

import { View, StyleSheet } from 'react-native';
import { FormTextInput } from '.';

const styles = StyleSheet.create({
	paddingHorizontal: {
		paddingHorizontal: 14
	}
});

const stories = storiesOf('Text Input', module);

const item = {
	name: 'Rocket.Chat',
	longText: 'https://open.rocket.chat/images/logo/android-chrome-512x512.png'
};

stories.add('Short and Long Text', () => (
	<>
		<View style={styles.paddingHorizontal}>
			<FormTextInput label='Short Text' placeholder='placeholder' value={item.name} />

			<FormTextInput label='Long Text' placeholder='placeholder' value={item.longText} />
		</View>
	</>
));
