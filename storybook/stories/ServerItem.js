/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types */
import React from 'react';
import { SafeAreaView, FlatList } from 'react-native';
import { storiesOf } from '@storybook/react-native';

import ServerItemComponent from '../../app/presentation/ServerItem';
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

const ServerItem = props => (
	<ServerItemComponent
		item={item}
		onPress={() => alert('Press')}
		hasCheck={false}
		{...props}
	/>
);

stories.add('long press', () => (
	<ServerItem onLongPress={() => alert('Long Press')} />
));

stories.add('content', () => (
	<>
		<ServerItem
			hasCheck
		/>
		<ServerItem
			item={item2}
		/>
		<ServerItem
			item={item3}
		/>
	</>
));

const ThemeStory = ({ theme }) => (
	<ThemeContext.Provider value={theme}>
		<ServerItem
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
				<ServerItem />
			)}
			keyExtractor={index => String(index)}
		/>
	</SafeAreaView>
));
