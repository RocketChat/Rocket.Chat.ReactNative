import { type ReactNode } from 'react';

import { ThemeContext, type TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants/colors';
import NotifierComponent from './NotifierComponent';
import { SubscriptionType } from '../../definitions';
import {
	BASE_ROW_HEIGHT,
	BASE_ROW_HEIGHT_CONDENSED,
	ResponsiveLayoutContext
} from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const responsiveLayoutProviderValue = {
	fontScale: 1,
	fontScaleLimited: 1,
	isLargeFontScale: false,
	rowHeight: BASE_ROW_HEIGHT,
	rowHeightCondensed: BASE_ROW_HEIGHT_CONDENSED,
	width: 300,
	height: 800
};

const baseNotification = {
	text: 'Hey! How are you doing?',
	payload: {
		_id: '1',
		rid: 'rid-1',
		name: 'general',
		sender: { username: 'rocket.cat' },
		type: SubscriptionType.CHANNEL
	},
	title: 'general',
	avatar: 'rocket.cat'
};

const Wrapper = ({ children, theme = 'light' }: { children: ReactNode; theme?: TSupportedThemes }) => (
	<ThemeContext.Provider value={{ theme, colors: themes[theme] }}>
		<ResponsiveLayoutContext.Provider value={responsiveLayoutProviderValue}>{children}</ResponsiveLayoutContext.Provider>
	</ThemeContext.Provider>
);

export default {
	title: 'InAppNotification'
};

export const DirectMessage = () => (
	<Wrapper>
		<NotifierComponent
			notification={{
				...baseNotification,
				payload: {
					...baseNotification.payload,
					type: SubscriptionType.DIRECT,
					sender: { username: 'diego.mello' }
				},
				title: 'diego.mello',
				avatar: 'diego.mello'
			}}
		/>
	</Wrapper>
);
export const ChannelMessage = () => (
	<Wrapper>
		<NotifierComponent notification={baseNotification} />
	</Wrapper>
);
export const WithDarkTheme = () => (
	<Wrapper theme='dark'>
		<NotifierComponent notification={baseNotification} />
	</Wrapper>
);
export const WithBlackTheme = () => (
	<Wrapper theme='black'>
		<NotifierComponent notification={baseNotification} />
	</Wrapper>
);
