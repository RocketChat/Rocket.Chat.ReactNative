import React from 'react';
import { ScrollView } from 'react-native';
import { Provider } from 'react-redux';

import { createStore, combineReducers } from 'redux';
import Avatar from '../../app/containers/Avatar';

const reducers = combineReducers({ settings: () => ({}) });
const store = createStore(reducers);


export default (
	<Provider store={store}>
		<ScrollView>
			<Avatar text='test' />
			<Avatar size={40} text='aa' />
			<Avatar size={30} text='bb' />
			<Avatar text='test' borderRadius={2} />
		</ScrollView>
	</Provider>
);
