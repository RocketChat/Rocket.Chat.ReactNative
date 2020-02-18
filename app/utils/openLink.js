import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import RNUserDefaults from 'rn-user-defaults';
import parse from 'url-parse';

import { themes } from '../constants/colors';

export const DEFAULT_BROWSER_KEY = 'DEFAULT_BROWSER_KEY';

const scheme = {
	chrome: 'googlechrome:',
	chromeSecure: 'googlechromes:',
	firefox: 'firefox:',
	brave: 'brave:'
};

const appSchemeURL = (url, browser) => {
	let schemeUrl = url;
	const parsedUrl = parse(url, true);
	const { protocol } = parsedUrl;
	const isSecure = ['https:'].includes(protocol);

	if (browser === 'googlechrome') {
		if (!isSecure) {
			schemeUrl = url.replace(protocol, scheme.chrome);
		} else {
			schemeUrl = url.replace(protocol, scheme.chromeSecure);
		}
	} else if (browser === 'firefox') {
		schemeUrl = `${ scheme.firefox }//open-url?url=${ url }`;
	} else if (browser === 'brave') {
		schemeUrl = `${ scheme.brave }//open-url?url=${ url }`;
	}

	return schemeUrl;
};

const openLink = async(url, theme = 'light') => {
	try {
		const browser = await RNUserDefaults.get(DEFAULT_BROWSER_KEY);

		if (browser) {
			const schemeUrl = appSchemeURL(url, browser.replace(':', ''));
			await Linking.openURL(schemeUrl);
		} else {
			await WebBrowser.openBrowserAsync(url, {
				toolbarColor: themes[theme].headerBackground,
				controlsColor: themes[theme].headerTintColor,
				collapseToolbar: true,
				showTitle: true
			});
		}
	} catch {
		try {
			await Linking.openURL(url);
		} catch {
			// do nothing
		}
	}
};

export default openLink;
