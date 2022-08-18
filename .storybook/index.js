import { getStorybookUI } from '@storybook/react-native';
import './storybook.requires';

import RNBootSplash from 'react-native-bootsplash';

import { selectServerRequest } from '../app/actions/server';
import { mockedStore as store } from '../app/reducers/mockedStore';
import database from '../app/lib/database';

RNBootSplash.hide();

store.dispatch(selectServerRequest('https://open.rocket.chat'));

database.setActiveDB('https://open.rocket.chat');

const StorybookUIRoot = getStorybookUI({});
export default StorybookUIRoot;
