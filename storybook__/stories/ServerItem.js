import React from 'react';
import { storiesOf } from '@storybook/react-native';

import ServerItemComponent from '../../app/containers/ServerItem';
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

const ServerItem = ({ theme = themes.light, ...props }) => (
	<ThemeContext.Provider
		value={{
			theme,
			themePreferences: {
				currentTheme: theme,
				darkLevel: theme
			}
		}}
	>
		<ServerItemComponent item={item} hasCheck={false} {...props} />
	</ThemeContext.Provider>
);

stories.add('content', () => (
	<>
		<ServerItem hasCheck />
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

stories.add('themes', () => (
	<>
		<ServerItem theme={themes.light} />
		<ServerItem theme={themes.dark} />
		<ServerItem theme={themes.black} />
	</>
));
