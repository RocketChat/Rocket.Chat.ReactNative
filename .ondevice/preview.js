import React from 'react';
import { ScrollView } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { mockedStore as store } from '../app/reducers/mockedStore';
import { themes } from '../app/lib/constants';

export const decorators = [
	Story => (
		<Provider store={store}>
			<SafeAreaProvider>
				<ScrollView style={{ backgroundColor: themes['light'].backgroundColor }}>
					<Story />
				</ScrollView>
			</SafeAreaProvider>
		</Provider>
	)
];
