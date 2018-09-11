import React from 'react';
import { ScrollView } from 'react-native';
import { Provider } from 'react-redux';

import { createStore, combineReducers } from 'redux';
import Avatar from '../../app/containers/Avatar';

const reducers = combineReducers({ settings: () => ({}) });
const store = createStore(reducers);
const baseUrl = 'baseUrl';

export default (
	<Provider store={store}>
		<ScrollView>
			<Avatar text='test' baseUrl={baseUrl} />
			<Avatar size={40} text='aa' baseUrl={baseUrl} />
			<Avatar size={30} text='bb' baseUrl={baseUrl} />
			<Avatar text='test' baseUrl={baseUrl} borderRadius={2} />
		</ScrollView>
	</Provider>
);
