import React, { Component } from 'react';
import { Navigation } from 'react-native-navigation';
import { getStorybookUI, configure } from '@storybook/react-native'; // eslint-disable-line

// import stories
configure(() => {
	require('./stories');
}, module);

// This assumes that storybook is running on the same host as your RN packager,
// to set manually use, e.g. host: 'localhost' option
const StorybookUIRoot = getStorybookUI({ port: 7007, onDeviceUI: true });

// react-native hot module loader must take in a Class - https://github.com/facebook/react-native/issues/10991
// https://github.com/storybooks/storybook/issues/2081
// eslint-disable-next-line react/prefer-stateless-function
class StorybookUIHMRRoot extends Component {
	render() {
		return <StorybookUIRoot />;
	}
}

Navigation.registerComponent('storybook.UI', () => StorybookUIHMRRoot);
Navigation.startSingleScreenApp({
	screen: {
		screen: 'storybook.UI',
		title: 'Storybook'
	}
});

export default StorybookUIHMRRoot;
