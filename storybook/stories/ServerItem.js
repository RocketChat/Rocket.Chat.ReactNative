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
	name: 'https://open.rocket.chat/',
	id: 'some.user',
	iconURL: 'https://open.rocket.chat/images/logo/android-chrome-512x512.png'
};

const item2 = {
	name: 'https://superlongservername.rocket.chat/',
	id: 'superlongusername.tologintoasuperlongservername'
};

stories.add('unselected server', () => (
	<ServerItem
		item={item}
		onPress={() => alert('Hi')}
		onLongPress={() => alert('Deleted')}
		theme={themes.light}
	/>
));

stories.add('selected server', () => (
	<ServerItem
		item={item}
		onPress={() => alert('Hi')}
		onLongPress={() => alert('Deleted')}
		hasCheck
		theme={themes.light}
	/>
));

stories.add('with long url and username', () => (
	<ServerItem
		item={item2}
		onPress={() => alert('Hi')}
		onLongPress={() => alert('Deleted')}
		theme={themes.light}
	/>
));

const ThemeStory = ({ theme }) => (
	<ThemeContext.Provider value={{ theme }}>
		<ServerItem
			item={item}
			onPress={() => alert('Hi')}
			onLongPress={() => alert('Deleted')}
			theme={theme}
			hasCheck
		/>
	</ThemeContext.Provider>
);

stories.add('with dark theme', () => <ThemeStory theme={themes.dark} />);

stories.add('with black theme', () => <ThemeStory theme={themes.black} />);

stories.add('with FlatList', () => (
	<SafeAreaView>
		<FlatList
			data={[...Array(20).keys()]}
			renderItem={() => (
				<ServerItem
					item={item}
					onPress={() => alert('Hi')}
					onLongPress={() => alert('Deleted')}
					theme={themes.light}
				/>
			)}
			keyExtractor={index => index}
		/>
	</SafeAreaView>
));
