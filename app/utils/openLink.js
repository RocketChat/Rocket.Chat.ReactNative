import * as WebBrowser from 'expo-web-browser';

import { themes } from '../constants/colors';

const openLink = (url, theme = 'light') => WebBrowser.openBrowserAsync(url, {
	toolbarColor: themes[theme].headerBackground,
	controlsColor: themes[theme].headerTintColor,
	collapseToolbar: true,
	showTitle: true
});

export default openLink;
