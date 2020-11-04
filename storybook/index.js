import { AppRegistry } from 'react-native';
import { getStorybookUI, configure } from '@storybook/react-native'; // eslint-disable-line

import RNBootSplash from 'react-native-bootsplash';
import 'react-native-gesture-handler';

// eslint-disable-next-line no-undef
jest.mock('../app/lib/database', () => jest.fn(() => null)); // comment this line to make storybook work

RNBootSplash.hide();

// import stories
configure(() => {
	require('./stories');
}, module);

// Refer to https://github.com/storybooks/storybook/tree/master/app/react-native#start-command-parameters
// To find allowed options for getStorybookUI
const StorybookUIRoot = getStorybookUI({
	asyncStorage: null
});

// If you are using React Native vanilla and after installation you don't see your app name here, write it manually.
// If you use Expo you can safely remove this line.
AppRegistry.registerComponent('RocketChatRN', () => StorybookUIRoot);

export default StorybookUIRoot;
