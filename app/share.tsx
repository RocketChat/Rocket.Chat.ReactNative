import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';

import { getTheme, setNativeTheme, initialTheme as initialThemeFunction, unsubscribeTheme } from './lib/methods/helpers/theme';
import UserPreferences from './lib/methods/userPreferences';
import Navigation from './lib/navigation/shareNavigation';
import store from './lib/store';
import { initStore } from './lib/store/auxStore';
import { closeShareExtension, shareExtensionInit } from './lib/methods/shareExtension';
import { defaultHeader, getActiveRouteName, navigationTheme, themedHeader } from './lib/methods/helpers/navigation';
import { ThemeContext } from './theme';
import { localAuthenticate } from './lib/methods/helpers/localAuthentication';
import ScreenLockedView from './views/ScreenLockedView';
// Outside Stack
import WithoutServersView from './views/WithoutServersView';
// Inside Stack
import ShareListView from './views/ShareListView';
import ShareView from './views/ShareView';
import SelectServerView from './views/SelectServerView';
import { setCurrentScreen } from './lib/methods/helpers/log';
import AuthLoadingView from './views/AuthLoadingView';
import { DimensionsContext } from './dimensions';
import { ShareInsideStackParamList, ShareOutsideStackParamList, ShareAppStackParamList } from './definitions/navigationTypes';
import { colors, CURRENT_SERVER } from './lib/constants';
import Loading from './containers/Loading';

initStore(store);

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
export const App = ({ root }: { root: string }): React.ReactElement => (
	<Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
		<>
			{!root ? <Stack.Screen name='AuthLoading' component={AuthLoadingView} /> : null}
			{root === 'outside' ? <Stack.Screen name='OutsideStack' component={OutsideStack} /> : null}
			{root === 'inside' ? <Stack.Screen name='InsideStack' component={InsideStack} /> : null}
		</>
	</Stack.Navigator>
);

const { width, height, scale, fontScale } = Dimensions.get('screen');
const initialTheme = initialThemeFunction();
const theme = getTheme(initialTheme);

const Root = (): React.ReactElement => {
	const [root, setRoot] = useState('');
	const navTheme = navigationTheme(theme);

	useLayoutEffect(() => {
		setNativeTheme(initialTheme);
	}, []);

	useEffect(() => {
		const authenticateShare = async (currentServer: string) => {
			await localAuthenticate(currentServer);
			setRoot('inside');
			await shareExtensionInit(currentServer);
		};

		const currentServer = UserPreferences.getString(CURRENT_SERVER);
		if (currentServer) {
			authenticateShare(currentServer);
		} else {
			setRoot('outside');
		}

		const state = Navigation.navigationRef.current?.getRootState();
		const currentRouteName = getActiveRouteName(state);
		Navigation.routeNameRef.current = currentRouteName;
		setCurrentScreen(currentRouteName);

		return () => {
			closeShareExtension();
			unsubscribeTheme();
		};
	}, []);

	return (
		<Provider store={store}>
			<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>
				<DimensionsContext.Provider
					value={{
						width,
						height,
						scale,
						fontScale
					}}
				>
					<NavigationContainer
						theme={navTheme}
						ref={Navigation.navigationRef}
						onStateChange={state => {
							const previousRouteName = Navigation.routeNameRef.current;
							const currentRouteName = getActiveRouteName(state);
							if (previousRouteName !== currentRouteName) {
								setCurrentScreen(currentRouteName);
							}
							Navigation.routeNameRef.current = currentRouteName;
						}}
					>
						<App root={root} />
						<Loading />
					</NavigationContainer>
					<ScreenLockedView />
				</DimensionsContext.Provider>
			</ThemeContext.Provider>
		</Provider>
	);
};

export default Root;
