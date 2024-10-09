import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ThemeContext } from '../theme';
import { defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
import SelectServerView from '../views/SelectServerView';
import ShareListView from '../views/ShareListView';
import ShareView from '../views/ShareView';

const ShareExtension = createNativeStackNavigator<any>();
const ShareExtensionStack = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<ShareExtension.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			{/* @ts-ignore */}
			<ShareExtension.Screen name='ShareListView' component={ShareListView} />
			{/* @ts-ignore */}
			<ShareExtension.Screen name='ShareView' component={ShareView} />
			<ShareExtension.Screen name='SelectServerView' component={SelectServerView} />
		</ShareExtension.Navigator>
	);
};

export default ShareExtensionStack;
