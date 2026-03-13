import AsyncStorage from '@react-native-async-storage/async-storage';
import RNBootSplash from 'react-native-bootsplash';

import { view } from './storybook.requires';

const StorybookUIRoot = view.getStorybookUI({
	storage: {
		getItem: AsyncStorage.getItem,
		setItem: AsyncStorage.setItem
	}
});

RNBootSplash.hide();

export default StorybookUIRoot;
