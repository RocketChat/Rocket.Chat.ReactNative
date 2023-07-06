import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { defaultHeader, themedHeader } from '../../lib/methods/helpers/navigation';
import { ThemeContext } from '../../theme';
// Outside Stack
import WithoutServersView from '../../views/WithoutServersView';
// Inside Stack
import ShareListView from '../../views/ShareListView';
import ShareView from '../../views/ShareView';
import SelectServerView from '../../views/SelectServerView';
import AuthLoadingView from '../../views/AuthLoadingView';
import { ShareAppStackParamList, ShareInsideStackParamList, ShareOutsideStackParamList } from './types';

const Inside = createStackNavigator<ShareInsideStackParamList>();
const InsideStack = () => {
	const { theme } = useContext(ThemeContext);

	const screenOptions = {
		...defaultHeader,
		...themedHeader(theme)
	};
	screenOptions.headerStyle = { ...screenOptions.headerStyle, height: 57 };

	return (
		<Inside.Navigator screenOptions={screenOptions}>
			<Inside.Screen name='ShareListView' component={ShareListView} />
			<Inside.Screen name='ShareView' component={ShareView} />
			<Inside.Screen name='SelectServerView' component={SelectServerView} />
		</Inside.Navigator>
	);
};

const Outside = createStackNavigator<ShareOutsideStackParamList>();
const OutsideStack = () => {
	const { theme } = useContext(ThemeContext);

	return (
		<Outside.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<Outside.Screen name='WithoutServersView' component={WithoutServersView} />
		</Outside.Navigator>
	);
};

// App
const Stack = createStackNavigator<ShareAppStackParamList>();
const ShareExtensionStack = ({ root }: { root: string }): React.ReactElement => (
	<Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
		<>
			{!root ? <Stack.Screen name='AuthLoading' component={AuthLoadingView} /> : null}
			{root === 'outside' ? <Stack.Screen name='OutsideStack' component={OutsideStack} /> : null}
			{root === 'inside' ? <Stack.Screen name='InsideStack' component={InsideStack} /> : null}
		</>
	</Stack.Navigator>
);

export default ShareExtensionStack;
