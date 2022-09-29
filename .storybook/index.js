import { getStorybookUI } from '@storybook/react-native';
import './storybook.requires';

import RNBootSplash from 'react-native-bootsplash';

import { selectServerRequest } from '../app/actions/server';
import { mockedStore as store } from '../app/reducers/mockedStore';
import database from '../app/lib/database';
import { setUser } from '../app/actions/login';

RNBootSplash.hide();

const baseUrl = 'https://open.rocket.chat';
store.dispatch(selectServerRequest(baseUrl));
store.dispatch(setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat' }));
database.setActiveDB(baseUrl);

const StorybookUIRoot = getStorybookUI({});
export default StorybookUIRoot;
