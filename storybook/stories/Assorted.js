/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types */
import React from 'react';
import { storiesOf } from '@storybook/react-native';

import { View } from 'react-native';
import TextInput from '../../app/containers/TextInput';

const stories = storiesOf('AssortedItems', module);

const item = {
	name: 'Rocket.Chat',
	longText: 'https://open.rocket.chat/images/logo/android-chrome-512x512.png'
};

const theme = 'light';


stories.add('Text input', () => (
	<>
		<View style={{ paddingHorizontal: 14 }}>
			<TextInput
				label='Short Text'
				placeholder='placeholder'
				value={item.name}
				theme={theme}
			/>

			<TextInput
				label='Long Text'
				placeholder='placeholder'
				value={item.longText}
				theme={theme}
			/>
		</View>
	</>
));

