import { AppRegistry } from 'react-native';
import { getStorybookUI } from '@storybook/react-native';

import './storybook.requires';

const StorybookUIRoot = getStorybookUI({
	asyncStorage: null
});

AppRegistry.registerComponent('RocketChatRN', () => StorybookUIRoot);

export default StorybookUIRoot;
