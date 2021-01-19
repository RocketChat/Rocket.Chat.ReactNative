/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types */
import React from 'react';
import { SafeAreaView, FlatList } from 'react-native';
import { storiesOf } from '@storybook/react-native';

import ServerItem from '../../app/presentation/ServerItem';
import { ThemeContext } from '../../app/theme';

const stories = storiesOf('ServerItem', module);

const themes = {
	light: 'light',
	dark: 'dark',
	black: 'black'
};

const item = {
	name: 'Rocket.Chat',
	id: 'https://open.rocket.chat/',
	iconURL: 'https://open.rocket.chat/images/logo/android-chrome-512x512.png'
};

const item2 = {
	name: 'Super Long Server Name in Rocket.Chat',
	id: 'https://superlongservername.tologintoasuperlongservername/'
};

const item3 = {
	id: 'https://stable.rocket.chat/'
};

stories.add('pressable', () => (
	<ServerItem
		item={item}
		onPress={() => alert('Press')}
		onLongPress={() => alert('Long Press')}
	/>
));

stories.add('content', () => (
	<>
		<ServerItem
			item={item}
			hasCheck
			onPress={() => alert('Press')}
			onLongPress={() => alert('Long Press')}
		/>
		<ServerItem
			item={item2}
			onPress={() => alert('Press')}
			onLongPress={() => alert('Long Press')}
		/>
		<ServerItem
			item={item3}
			onPress={() => alert('Press')}
			onLongPress={() => alert('Long Press')}
		/>
	</>
));

const ThemeStory = ({ theme }) => (
	<ThemeContext.Provider value={theme}>
		<ServerItem
			item={item}
			onPress={() => alert('Press')}
			onLongPress={() => alert('Long Press')}
			theme={theme}
			hasCheck
		/>
	</ThemeContext.Provider>
);

stories.add('themes', () => (
	<>
		<ThemeStory theme={themes.light} />
		<ThemeStory theme={themes.dark} />
		<ThemeStory theme={themes.black} />
	</>
));

stories.add('with FlatList', () => (
	<SafeAreaView>
		<FlatList
			data={[...Array(20).keys()]}
			renderItem={() => (
				<ServerItem
					item={item}
					onPress={() => alert('Press')}
					onLongPress={() => alert('Long Press')}
					theme={themes.light}
				/>
			)}
			keyExtractor={index => index}
		/>
	</SafeAreaView>
));
