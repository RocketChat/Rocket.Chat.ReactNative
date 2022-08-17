import React from 'react';

import ServerItemComponent from '.';
import { ThemeContext } from '../../theme';

export default {
	title: 'ServerItem'
};

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
			// @ts-ignore
			theme
		}}
	>
		<ServerItemComponent item={item} hasCheck={false} onPress={() => alert('Press')} {...props} />
	</ThemeContext.Provider>
);

export const Content = () => (
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
);

export const Touchable = () => (
	<>
		<ServerItem onLongPress={() => alert('Long Press')} />
	</>
);

export const Themes = () => (
	<>
		<ServerItem theme={themes.light} />
		<ServerItem theme={themes.dark} />
		<ServerItem theme={themes.black} />
	</>
);
