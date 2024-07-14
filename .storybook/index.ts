import AsyncStorage from '@react-native-async-storage/async-storage';
import { view } from './storybook.requires';
import RNBootSplash from 'react-native-bootsplash';

const StorybookUIRoot = view.getStorybookUI({
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
  },
});

RNBootSplash.hide();

export default StorybookUIRoot;
