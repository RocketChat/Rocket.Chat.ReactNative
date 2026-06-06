import React from 'react';

import { themes } from '../../lib/constants/colors';
import ServerAvatar from './ServerAvatar';
import { ThemeContext, type TSupportedThemes } from '../../theme';

export default {
	title: 'WorkspaceView/ServerAvatar'
};

const BASE_URL = 'https://open.rocket.chat';

const ThemedServerAvatar = ({
	url = BASE_URL,
	image,
	theme = 'light'
}: {
	url?: string;
	image?: string;
	theme?: TSupportedThemes;
}) => (
	<ThemeContext.Provider
		value={{
			theme,
			colors: themes[theme]
		}}>
		<ServerAvatar url={url} image={image} />
	</ThemeContext.Provider>
);

export const WithImage = () => <ThemedServerAvatar image='images/logo/android-chrome-512x512.png' />;

export const WithoutImage = () => <ThemedServerAvatar />;

export const WithEmptyImage = () => <ThemedServerAvatar image='' />;

export const Themes = () => (
	<>
		<ThemedServerAvatar image='images/logo/android-chrome-512x512.png' theme='light' />
		<ThemedServerAvatar image='images/logo/android-chrome-512x512.png' theme='dark' />
		<ThemedServerAvatar image='images/logo/android-chrome-512x512.png' theme='black' />
	</>
);

export const SkeletonThemes = () => (
	<>
		<ThemedServerAvatar theme='light' />
		<ThemedServerAvatar theme='dark' />
		<ThemedServerAvatar theme='black' />
	</>
);
