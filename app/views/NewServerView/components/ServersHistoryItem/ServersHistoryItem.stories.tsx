import React from 'react';

import { themes } from '../../../../lib/constants/colors';
import ServersHistoryItemComponent, { type IServersHistoryItem } from '.';
import { ThemeContext, type TSupportedThemes } from '../../../../theme';
import { type TServerHistoryModel } from '../../../../definitions';

export default {
	title: 'ServersHistoryItem'
};

const defaultItem = {
	id: '1',
	url: 'https://open.rocket.chat',
	username: 'john.doe',
	updatedAt: new Date(),
	iconURL: 'https://open.rocket.chat/images/logo/android-chrome-512x512.png'
} as TServerHistoryModel;

const ServersHistoryItem = ({
	item,
	theme = 'light',
	onPress = () => alert('Press'),
	onDeletePress
}: {
	item?: Partial<TServerHistoryModel>;
	theme?: TSupportedThemes;
	onPress?: IServersHistoryItem['onPress'];
	onDeletePress?: IServersHistoryItem['onDeletePress'];
}) => (
	<ThemeContext.Provider
		value={{
			theme,
			colors: themes[theme]
		}}>
		<ServersHistoryItemComponent
			item={{ ...defaultItem, ...item } as TServerHistoryModel}
			onPress={onPress}
			onDeletePress={onDeletePress || (() => alert('Delete'))}
		/>
	</ThemeContext.Provider>
);

export const Content = () => (
	<>
		<ServersHistoryItem />
		<ServersHistoryItem
			item={{
				url: 'https://superlongservername.tologintoasuperlongservername.rocket.chat',
				username: 'very.long.username.here'
			}}
		/>
		<ServersHistoryItem
			item={{
				url: 'https://stable.rocket.chat',
				username: 'admin',
				iconURL: undefined
			}}
		/>
	</>
);

export const SwipeActions = () => (
	<>
		<ServersHistoryItem onDeletePress={() => alert('Delete Server History')} />
		<ServersHistoryItem
			item={{ url: 'https://example.com', username: 'user123' }}
			onDeletePress={() => alert('Delete Server History')}
		/>
	</>
);

export const Themes = () => (
	<>
		<ServersHistoryItem theme={'light'} />
		<ServersHistoryItem theme={'dark'} />
		<ServersHistoryItem theme={'black'} />
	</>
);
