import * as WebBrowser from 'expo-web-browser';

import { HEADER_TINT, HEADER_BACKGROUND } from '../constants/colors';

const openLink = url => WebBrowser.openBrowserAsync(url, {
	toolbarColor: HEADER_BACKGROUND,
	controlsColor: HEADER_TINT,
	collapseToolbar: true,
	showTitle: true
});

export default openLink;
