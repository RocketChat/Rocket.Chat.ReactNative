import React from 'react';

import { themes } from '../../lib/constants/colors';
import ServerItemComponent, { type IServerItem } from '.';
import { ThemeContext, type TSupportedThemes } from '../../theme';

export default {
	title: 'ServerItem'
};

const defaultItem = {
	name: 'Rocket.Chat',
	id: 'https://open.rocket.chat/',
	iconURL: 'https://open.rocket.chat/images/logo/android-chrome-512x512.png'
};

const ServerItem = ({
	item,
	theme = 'light',
	onPress = () => alert('Press'),
	onDeletePress,
	hasCheck
}: {
	item?: Partial<IServerItem['item']>;
	theme?: TSupportedThemes;
	onPress?: IServerItem['onPress'];
	onDeletePress?: IServerItem['onDeletePress'];
	hasCheck?: IServerItem['hasCheck'];
}) => (
	<ThemeContext.Provider
		value={{
			theme,
			colors: themes[theme]
		}}>
		<ServerItemComponent item={{ ...defaultItem, ...item }} onPress={onPress} onDeletePress={onDeletePress} hasCheck={hasCheck} />
	</ThemeContext.Provider>
);

export const Content = () => (
	<>
		<ServerItem hasCheck />
		<ServerItem
			item={{
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

export const SwipeActions = () => (
	<>
		<ServerItem onDeletePress={() => alert('Delete Server')} />
		<ServerItem item={{ name: 'Another Server', id: 'https://example.com/' }} onDeletePress={() => alert('Delete Server')} />
	</>
);

export const Themes = () => (
	<>
		<ServerItem theme={'light'} />
		<ServerItem theme={'dark'} />
		<ServerItem theme={'black'} />
	</>
);
