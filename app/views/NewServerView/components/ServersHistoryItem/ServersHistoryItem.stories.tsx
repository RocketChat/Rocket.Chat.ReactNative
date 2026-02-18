import React from 'react';

import { themes } from '../../../../lib/constants/colors';
import ServersHistoryItemComponent, { type IServersHistoryItem } from '.';
import { ThemeContext, type TSupportedThemes } from '../../../../theme';
import { type TServerHistoryModel } from '../../../../definitions';
import {
	BASE_ROW_HEIGHT,
	BASE_ROW_HEIGHT_CONDENSED,
	ResponsiveLayoutContext
} from '../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

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

const responsiveLayoutProviderValue = {
	fontScale: 1,
	fontScaleLimited: 1,
	isLargeFontScale: false,
	rowHeight: BASE_ROW_HEIGHT,
	rowHeightCondensed: BASE_ROW_HEIGHT_CONDENSED,
	width: 350,
	height: 800
};

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
		<ResponsiveLayoutContext.Provider value={responsiveLayoutProviderValue}>
			<ServersHistoryItemComponent
				item={{ ...defaultItem, ...item } as TServerHistoryModel}
				onPress={onPress}
				onDeletePress={onDeletePress || (() => alert('Delete'))}
			/>
		</ResponsiveLayoutContext.Provider>
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
