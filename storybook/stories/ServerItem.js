/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types */
import React from 'react';
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

const ServerItem = props => (
	<ServerItemComponent
		item={item}
		hasCheck={false}
		{...props}
	/>
);

stories.add('content', () => (
	<>
		<ServerItem
			hasCheck
		/>
		<ServerItem
			item={{
				...item,
				name: 'Super Long Server Name in Rocket.Chat',
				id: 'https://superlongservername.tologintoasuperlongservername/'
			}}
		/>
		<ServerItem
			item={{
				id: 'https://stable.rocket.chat/'
			}}
		/>
	</>
));

stories.add('touchable', () => (
	<>
		<ServerItem onLongPress={() => alert('Long Press')} onPress={() => alert('Press')} />
		<ServerItem onPress={() => alert('Press')} />
		<ServerItem onLongPress={() => alert('Long Press')} />
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
