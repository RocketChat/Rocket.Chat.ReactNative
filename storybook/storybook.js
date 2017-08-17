/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, global-require */

import { Navigation } from 'react-native-navigation';
import { getStorybookUI, configure } from '@storybook/react-native';

// import stories
configure(() => {
	require('./stories');
}, module);

// This assumes that storybook is running on the same host as your RN packager,
// to set manually use, e.g. host: 'localhost' option
const StorybookUI = getStorybookUI({ port: 7007, onDeviceUI: true });
Navigation.registerComponent('storybook.UI', () => StorybookUI);
Navigation.startSingleScreenApp({
	screen: {
		screen: 'storybook.UI',
		title: 'Storybook',
		navigatorStyle: {
			navBarHidden: true
		}
	}
});

export default StorybookUI;
