import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';

import { getTheme, setNativeTheme, initialTheme as initialThemeFunction } from './lib/methods/helpers/theme';
import UserPreferences from './lib/methods/userPreferences';
import Navigation from './lib/navigation/shareNavigation';
import store from './lib/store';
import { initStore } from './lib/store/auxStore';
import { closeShareExtension, shareExtensionInit } from './lib/methods/shareExtension';
import { getActiveRouteName, navigationTheme } from './lib/methods/helpers/navigation';
import { ThemeContext } from './theme';
import { localAuthenticate } from './lib/methods/helpers/localAuthentication';
import ScreenLockedView from './views/ScreenLockedView';
import { setCurrentScreen } from './lib/methods/helpers/log';
import { DimensionsContext } from './dimensions';
import { colors, CURRENT_SERVER } from './lib/constants';
import Loading from './containers/Loading';
import ShareExtensionStack from './stacks/ShareExtensionStack';

initStore(store);

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
						<ShareExtensionStack root={root} />
						<Loading />
					</NavigationContainer>
					<ScreenLockedView />
				</DimensionsContext.Provider>
			</ThemeContext.Provider>
		</Provider>
	);
};

export default Root;
